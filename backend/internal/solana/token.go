package solana

import (
	"encoding/binary"
	"errors"
	"math"
	"portfolio-tracker/internal/models"

	"github.com/gagliardetto/solana-go"
)

// ParseTokenAccount extracts token data from account binary data
// This function parses the raw binary data of a Solana token account
// Parameters:
//   - data: raw binary data from the token account
//
// Returns:
//   - TokenHolding object containing parsed token data
//   - error if data is invalid or parsing fails
func ParseTokenAccount(data []byte) (*models.TokenHolding, error) {
	// Ensure minimum data length
	if len(data) < 165 {
		return nil, ErrInvalidAccountData
	}

	// Extract mint address
	mintAddr := solana.PublicKeyFromBytes(data[0:32])

	// Extract amount (starts at offset 64)
	amount := binary.LittleEndian.Uint64(data[64:72])

	// Extract decimals (at offset 44)
	decimals := uint8(data[44])

	// Calculate actual balance considering decimals
	balance := float64(amount) / math.Pow10(int(decimals))

	return &models.TokenHolding{
		TokenMint: mintAddr.String(),
		Symbol:    "Unknown", // Default value
		Balance:   balance,
	}, nil
}

// Custom errors for token account parsing
var (
	ErrInvalidAccountData = errors.New("invalid token account data")
)
