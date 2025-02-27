package api

import (
	"portfolio-tracker/internal/api/handlers"
	"portfolio-tracker/internal/solana"

	"github.com/gin-gonic/gin"
)

// SetupRouter configures all the routes for the API
// Parameters:
//   - solanaClient: initialized Solana client for blockchain operations
//
// Returns: configured Gin router with all routes registered
func SetupRouter(solanaClient *solana.Client) *gin.Engine {
	// Create Gin router with default middleware
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Create handlers with dependencies
	portfolioHandler := handlers.NewPortfolioHandler(solanaClient)

	// health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Setup routes group for API version 1
	v1 := router.Group("/api/v1")
	{
		// Define portfolio endpoints
		v1.GET("/portfolio/:address", portfolioHandler.GetPortfolio)
	}

	return router
}
