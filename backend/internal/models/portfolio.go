package models

// Portfolio represents a wallet's complete token holdings
// This struct aggregates all token balances and total value
// for a specific wallet address
type Portfolio struct {
	WalletAddress string         `json:"wallet_address"` // The wallet's public key address
	Tokens        []TokenHolding `json:"tokens"`         // List of all token holdings in the wallet
	TotalValue    float64        `json:"total_value"`    // Aggregate USD value of all tokens
}
