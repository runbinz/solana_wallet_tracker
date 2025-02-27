package solana

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"math"
	"portfolio-tracker/internal/models"
	"portfolio-tracker/internal/services"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
)

// Client wraps the Solana RPC client and provides high-level operations
// for interacting with the Solana blockchain
type Client struct {
	rpcClient    *rpc.Client            // Solana RPC client for blockchain interaction
	priceService *services.PriceService // Service for fetching token prices
}

// NewClient creates a new Solana client instance
// Parameters:
//   - rpcURL: URL of the Solana RPC endpoint
//
// Returns: initialized Solana client
func NewClient(rpcURL string) *Client {
	return &Client{
		rpcClient:    rpc.New(rpcURL), // Connect to Solana network
		priceService: services.NewPriceService(),
	}
}

// getTokenMetadata fetches metadata for a given token mint address
// Parameters:
//   - mint: token mint address as string
//
// Returns: token symbol and any error encountered
func (c *Client) getTokenMetadata(mint string) (string, error) {
	return "SOL Token", nil
}

// GetTokenAccounts fetches all token accounts for a wallet address
// This method:
// 1. Validates the wallet address
// 2. Fetches all token accounts owned by the wallet
// 3. Parses token data and fetches current prices
// 4. Calculates total portfolio value
// Parameters:
//   - walletAddress: Solana wallet address as base58 string
//
// Returns: Portfolio object containing token holdings and total value
func (c *Client) GetTokenAccounts(walletAddress string) (*models.Portfolio, error) {
	// Convert string address to PublicKey
	pubKey, err := solana.PublicKeyFromBase58(walletAddress)
	if err != nil {
		return nil, errors.New("invalid wallet address")
	}

	// Initialize portfolio
	portfolio := &models.Portfolio{
		WalletAddress: walletAddress,
		Tokens:        make([]models.TokenHolding, 0),
	}

	// // Add this new code here to get SOL balance
	balance, err := c.rpcClient.GetBalance(
		context.Background(),
		pubKey,
		rpc.CommitmentFinalized,
	)
	if err != nil {
		return nil, err
	}

	// Add SOL to portfolio
	solBalance := float64(balance.Value) / 1e9 // Convert lamports to SOL
	solPrice, err := c.priceService.GetTokenPrice("So11111111111111111111111111111111111111112")
	if err != nil {
		fmt.Printf("Error fetching SOL price: %v\n", err)
		solPrice = 0
	}
	solValue := solBalance * solPrice // Temporary hardcoded SOL price of $20

	portfolio.Tokens = append(portfolio.Tokens, models.TokenHolding{
		TokenMint:    "So11111111111111111111111111111111111111112", // Native SOL mint address
		Symbol:       "SOL",
		Balance:      solBalance,
		CurrentPrice: solPrice, // Hardcoded for now
		Value:        solValue,
	})

	totalValue := solValue // Initialize totalValue with SOL value

	// Get token accounts owned by the wallet
	accounts, err := c.rpcClient.GetTokenAccountsByOwner(
		context.Background(),
		pubKey,
		&rpc.GetTokenAccountsConfig{
			ProgramId: &solana.TokenProgramID,
		},
		&rpc.GetTokenAccountsOpts{},
	)
	if err != nil {
		return nil, err
	}

	for _, account := range accounts.Value {
		// Get token data from the raw account data
		data := account.Account.Data.GetBinary()

		// Token accounts have a minimum size
		if len(data) < 165 {
			continue
		}

		// Extract token data from account
		mintAddr := solana.PublicKeyFromBytes(data[0:32])
		amount := binary.LittleEndian.Uint64(data[64:72])
		decimals := uint8(data[44])

		// Get token balance (consider decimals)
		balance := float64(amount) / math.Pow10(int(decimals))

		// Get token symbol from metadata
		symbol, err := c.getTokenMetadata(mintAddr.String())
		if err != nil {
			symbol = "Unknown"
		}

		// Get price for the token
		price, err := c.priceService.GetTokenPrice(mintAddr.String())
		if err != nil {
			price = 0
		}

		value := balance * price

		// Create token holding
		token := models.TokenHolding{
			TokenMint:    mintAddr.String(),
			Symbol:       symbol,
			Balance:      balance,
			CurrentPrice: price,
			Value:        value,
		}

		totalValue += value
		portfolio.Tokens = append(portfolio.Tokens, token)

	}

	portfolio.TotalValue = totalValue
	return portfolio, nil
}
