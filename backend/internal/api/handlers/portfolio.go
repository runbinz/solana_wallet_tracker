// Create API handler
package handlers

import (
	"net/http"
	"portfolio-tracker/internal/services"
	"portfolio-tracker/internal/solana"

	"github.com/gin-gonic/gin"
)

// PortfolioHandler manages HTTP requests related to portfolio operations
// It encapsulates the Solana client dependency for portfolio-related functionality
type PortfolioHandler struct {
	solanaClient *solana.Client
	cache        *services.PortfolioCache
}

// NewPortfolioHandler creates a new portfolio handler instance
func NewPortfolioHandler(solanaClient *solana.Client, cache *services.PortfolioCache) *PortfolioHandler {
	return &PortfolioHandler{
		solanaClient: solanaClient,
		cache:        cache,
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

	if h.cache != nil {
		if p, ok := h.cache.Get(address); ok {
			c.JSON(http.StatusOK, p)
			return
		}
	}

	portfolio, err := h.solanaClient.GetTokenAccounts(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if h.cache != nil {
		h.cache.Set(address, portfolio)
	}
	c.JSON(http.StatusOK, portfolio)
}
