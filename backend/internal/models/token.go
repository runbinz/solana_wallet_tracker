package models

// TokenHolding represents a single token balance for a wallet
// This struct contains all relevant information about a token holding
// including its current value and price
type TokenHolding struct {
	// ____ appears in JSON as key "____", `json:"____"` is a struct tag
	TokenMint    string  `json:"token_mint"`    // Unique identifier of the token's mint address
	Symbol       string  `json:"symbol"`        // Human-readable token symbol (e.g., "SOL", "USDC")
	Balance      float64 `json:"balance"`       // Current token balance in native units
	CurrentPrice float64 `json:"current_price"` // Current market price in USD
	Value        float64 `json:"value"`         // Total value in USD (balance * current_price)
}
