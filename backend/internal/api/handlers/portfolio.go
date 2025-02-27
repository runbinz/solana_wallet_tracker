// Create API handler
package handlers

import (
	"net/http"
	"portfolio-tracker/internal/solana"

	"github.com/gin-gonic/gin"
)

// PortfolioHandler manages HTTP requests related to portfolio operations
// It encapsulates the Solana client dependency for portfolio-related functionality
type PortfolioHandler struct {
	solanaClient *solana.Client // Solana client for blockchain interactions
}

// NewPortfolioHandler creates a new portfolio handler instance
// Parameters:
//   - solanaClient: initialized Solana client for blockchain operations
//
// Returns: configured PortfolioHandler instance
func NewPortfolioHandler(solanaClient *solana.Client) *PortfolioHandler {
	return &PortfolioHandler{
		solanaClient: solanaClient,
	}
}

// GetPortfolio handles HTTP requests to fetch a wallet's portfolio
// This handler:
// 1. Extracts wallet address from the request
// 2. Validates the address
// 3. Fetches token accounts and balances
// 4. Returns the portfolio data as JSON
//
// Route: GET /api/v1/portfolio/:address
func (h *PortfolioHandler) GetPortfolio(c *gin.Context) {
	// Get wallet address from URL parameter
	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "wallet address is required"})
		return
	}

	// Use Solana client to fetch token accounts
	portfolio, err := h.solanaClient.GetTokenAccounts(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return successful response with portfolio
	c.JSON(http.StatusOK, portfolio)
}
