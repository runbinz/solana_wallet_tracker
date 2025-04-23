package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"portfolio-tracker/internal/models"
	"strconv"
	"time"
)

// PriceService handles fetching and caching of token prices
type PriceService struct {
	client *http.Client
	cache  *PriceCache
}

// NewPriceService creates a new price service instance
func NewPriceService() *PriceService {
	return &PriceService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		cache: NewPriceCache(),
	}
}

// GetTokenPrice fetches the current price for a token
// Parameters:
//   - symbol: token mint address
//
// Returns:
//   - price: current token price in USD
//   - error: any error encountered during price fetch
func (s *PriceService) GetTokenPrice(symbol string) (float64, error) {
	// Check cache first
	if price, found := s.cache.Get(symbol); found {
		return price, nil
	}

	if symbol == "So11111111111111111111111111111111111111112" {
		fmt.Println("Fetching SOL price from CoinCap...")
		CoinCapApiKey := os.Getenv("CoinCapApi")
		if CoinCapApiKey == "" {
			fmt.Println("CoinCap API key not found in environment variables")
			return 0, fmt.Errorf("CoinCap API key not found")
		}
		url := "https://rest.coincap.io/v3/assets/solana"

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			fmt.Printf("HTTP request failed: %v\n", err)
			return 0, err
		}
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", CoinCapApiKey))

		resp, err := s.client.Do(req)
		if err != nil {
			fmt.Printf("HTTP request failed: %v\n", err)
			return 0, err
		}
		defer resp.Body.Close()

		var coinCapResp models.CoinCapResponse
		if err := json.NewDecoder(resp.Body).Decode(&coinCapResp); err != nil {
			fmt.Printf("JSON decode error: %v\n", err)
			return 0, err
		}

		price, err := strconv.ParseFloat(coinCapResp.Data.PriceUsd, 64)
		if err != nil {
			fmt.Printf("Price parse error: %v\n", err)
			return 0, err
		}

		fmt.Printf("Found SOL price: $%.2f\n", price)
		return price, nil
	}

	return 0, fmt.Errorf("price not found for token: %s", symbol)
}
