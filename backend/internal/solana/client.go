package solana

import (
	"context"
	"encoding/binary"
	"errors"
	"math"
	"net"
	"net/http"
	"time"

	"portfolio-tracker/internal/models"
	"portfolio-tracker/internal/services"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
	"github.com/gagliardetto/solana-go/rpc/jsonrpc"
	"github.com/klauspost/compress/gzhttp"
)

const nativeSOLMint = "So11111111111111111111111111111111111111112"

// Client wraps the Solana RPC client and provides high-level operations
// for interacting with the Solana blockchain.
type Client struct {
	rpcClient *rpc.Client
	jupiter   *services.JupiterClient
}

// NewClient creates a new Solana client instance with bounded HTTP timeouts and gzip transport.
func NewClient(rpcURL string) *Client {
	httpClient := &http.Client{
		Timeout: 45 * time.Second,
		Transport: gzhttp.Transport(&http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   15 * time.Second,
				KeepAlive: 60 * time.Second,
			}).DialContext,
			ForceAttemptHTTP2:     true,
			MaxIdleConnsPerHost:   9,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   12 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		}),
	}
	rpcUnderlying := jsonrpc.NewClientWithOpts(rpcURL, &jsonrpc.RPCClientOpts{
		HTTPClient: httpClient,
	})
	return &Client{
		rpcClient: rpc.NewWithCustomRPCClient(rpcUnderlying),
		jupiter:   services.NewJupiterClient(),
	}
}

type mintAgg struct {
	rawAmount uint64
	decimals  uint8
}

func parseTokenAccount(data []byte) (mint solana.PublicKey, amount uint64, decimals uint8, ok bool) {
	if len(data) < 165 {
		return solana.PublicKey{}, 0, 0, false
	}
	mint = solana.PublicKeyFromBytes(data[0:32])
	decimals = uint8(data[44])
	amount = binary.LittleEndian.Uint64(data[64:72])
	return mint, amount, decimals, true
}

func mergeTokenAccounts(values []*rpc.TokenAccount) map[string]*mintAgg {
	byMint := make(map[string]*mintAgg)
	for _, v := range values {
		if v == nil {
			continue
		}
		data := v.Account.Data.GetBinary()
		mint, amount, decimals, ok := parseTokenAccount(data)
		if !ok {
			continue
		}
		key := mint.String()
		if cur, exists := byMint[key]; exists {
			cur.rawAmount += amount
			continue
		}
		byMint[key] = &mintAgg{rawAmount: amount, decimals: decimals}
	}
	return byMint
}

func (c *Client) fetchMergedTokenBalances(ctx context.Context, owner solana.PublicKey) (map[string]*mintAgg, error) {
	merged := make(map[string]*mintAgg)

	for _, programID := range []solana.PublicKey{solana.TokenProgramID, solana.Token2022ProgramID} {
		pid := programID
		accounts, err := rpcRetry(ctx, 3, func() (*rpc.GetTokenAccountsResult, error) {
			return c.rpcClient.GetTokenAccountsByOwner(
				ctx,
				owner,
				&rpc.GetTokenAccountsConfig{ProgramId: &pid},
				&rpc.GetTokenAccountsOpts{},
			)
		})
		if err != nil {
			return nil, err
		}
		if accounts == nil {
			continue
		}
		for mint, agg := range mergeTokenAccounts(accounts.Value) {
			if cur, ok := merged[mint]; ok {
				cur.rawAmount += agg.rawAmount
				continue
			}
			cp := *agg
			merged[mint] = &cp
		}
	}
	return merged, nil
}

// GetTokenAccounts fetches native SOL plus SPL / Token-2022 holdings and USD values via Jupiter.
func (c *Client) GetTokenAccounts(walletAddress string) (*models.Portfolio, error) {
	ctx := context.Background()

	pubKey, err := solana.PublicKeyFromBase58(walletAddress)
	if err != nil {
		return nil, errors.New("invalid wallet address")
	}

	portfolio := &models.Portfolio{
		WalletAddress: walletAddress,
		Tokens:        make([]models.TokenHolding, 0),
	}

	balance, err := rpcRetry(ctx, 3, func() (*rpc.GetBalanceResult, error) {
		return c.rpcClient.GetBalance(ctx, pubKey, rpc.CommitmentFinalized)
	})
	if err != nil {
		return nil, err
	}

	splByMint, err := c.fetchMergedTokenBalances(ctx, pubKey)
	if err != nil {
		return nil, err
	}

	mintsForQuotes := []string{nativeSOLMint}
	for m := range splByMint {
		mintsForQuotes = append(mintsForQuotes, m)
	}

	quotes, err := c.jupiter.FetchUSDQuotes(mintsForQuotes)
	if err != nil {
		quotes = map[string]services.MintQuote{}
	}

	solBalance := float64(balance.Value) / 1e9
	solQuote := quotes[nativeSOLMint]
	solValue := solBalance * solQuote.USDPrice

	if solBalance >= 1e-8 {
		portfolio.Tokens = append(portfolio.Tokens, models.TokenHolding{
			TokenMint:      nativeSOLMint,
			Symbol:         "SOL",
			Name:           "Solana",
			LogoURI:        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
			Decimals:       9,
			Balance:        solBalance,
			CurrentPrice:   solQuote.USDPrice,
			Value:          solValue,
			PriceSource:    "jupiter_price_v3",
			LastPriceAt:    solQuote.FetchedAt,
			PriceChange24h: solQuote.PriceChange24h,
		})
	}
	totalValue := solValue

	for mintStr, agg := range splByMint {
		if mintStr == nativeSOLMint {
			continue
		}
		if agg.rawAmount == 0 {
			continue
		}
		bal := float64(agg.rawAmount) / math.Pow10(int(agg.decimals))

		// Skip dust: balance too small to display meaningfully (< 0.00000001)
		if bal < 1e-8 {
			continue
		}

		sym, name, logo, _, metaOK := c.jupiter.LookupMetadata(mintStr)
		if !metaOK || sym == "" {
			sym = shortMint(mintStr)
		}
		decimals := int(agg.decimals)

		q := quotes[mintStr]
		val := bal * q.USDPrice
		totalValue += val

		portfolio.Tokens = append(portfolio.Tokens, models.TokenHolding{
			TokenMint:      mintStr,
			Symbol:         sym,
			Name:           name,
			LogoURI:        logo,
			Decimals:       decimals,
			Balance:        bal,
			CurrentPrice:   q.USDPrice,
			Value:          val,
			PriceSource:    "jupiter_price_v3",
			LastPriceAt:    q.FetchedAt,
			PriceChange24h: q.PriceChange24h,
		})
	}

	portfolio.TotalValue = totalValue
	return portfolio, nil
}

func shortMint(m string) string {
	if len(m) <= 8 {
		return m
	}
	return m[:4] + "…" + m[len(m)-4:]
}
