package solana

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"portfolio-tracker/internal/models"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
)

// GetWalletActivity returns recent signatures for a wallet (Solscan-friendly rows).
func (c *Client) GetWalletActivity(ctx context.Context, wallet string, limit int, before string) (*models.ActivityResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	pubKey, err := solana.PublicKeyFromBase58(wallet)
	if err != nil {
		return nil, errors.New("invalid wallet address")
	}

	opts := &rpc.GetSignaturesForAddressOpts{
		Limit:      &limit,
		Commitment: rpc.CommitmentFinalized,
	}
	if strings.TrimSpace(before) != "" {
		sig, err := solana.SignatureFromBase58(before)
		if err != nil {
			return nil, fmt.Errorf("invalid before signature: %w", err)
		}
		opts.Before = sig
	}

	sigs, err := rpcRetry(ctx, 3, func() ([]*rpc.TransactionSignature, error) {
		return c.rpcClient.GetSignaturesForAddressWithOpts(ctx, pubKey, opts)
	})
	if err != nil {
		return nil, err
	}

	out := &models.ActivityResponse{
		WalletAddress: wallet,
		Items:         make([]models.ActivityItem, 0, len(sigs)),
	}

	for _, s := range sigs {
		if s == nil {
			continue
		}
		sigStr := s.Signature.String()
		item := models.ActivityItem{
			Signature:            sigStr,
			Slot:                 s.Slot,
			SolscanURL:           "https://solscan.io/tx/" + sigStr,
			ConfirmationStatus:   string(s.ConfirmationStatus),
			Success:              s.Err == nil,
			ErrorSummary:         errSummary(s.Err),
			Memo:                 memoStr(s.Memo),
		}
		if s.BlockTime != nil {
			t := int64(*s.BlockTime)
			item.BlockTime = &t
		}
		out.Items = append(out.Items, item)
	}

	if len(out.Items) > 0 {
		out.NextBefore = out.Items[len(out.Items)-1].Signature
	}

	return out, nil
}

func memoStr(m *string) string {
	if m == nil {
		return ""
	}
	return *m
}

func errSummary(err interface{}) string {
	if err == nil {
		return ""
	}
	switch e := err.(type) {
	case string:
		return e
	case json.Number:
		return e.String()
	case float64:
		return strconv.FormatFloat(e, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(e)
	case map[string]interface{}:
		b, _ := json.Marshal(e)
		return string(b)
	default:
		b, _ := json.Marshal(e)
		return string(b)
	}
}
