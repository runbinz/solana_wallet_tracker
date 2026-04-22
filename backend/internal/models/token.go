package models

import "time"

// TokenHolding represents a single token balance for a wallet
type TokenHolding struct {
	TokenMint        string    `json:"token_mint"`
	Symbol           string    `json:"symbol"`
	Name             string    `json:"name,omitempty"`
	LogoURI          string    `json:"logo_uri,omitempty"`
	Decimals         int       `json:"decimals"`
	Balance          float64   `json:"balance"`
	CurrentPrice     float64   `json:"current_price"`
	Value            float64   `json:"value"`
	PriceSource      string    `json:"price_source,omitempty"`
	LastPriceAt      time.Time `json:"last_price_at,omitempty"`
	PriceChange24h   float64   `json:"price_change_24h,omitempty"`
}
