package api

import (
	"portfolio-tracker/internal/api/handlers"
	"portfolio-tracker/internal/api/middleware"
	"portfolio-tracker/internal/services"
	"portfolio-tracker/internal/solana"

	"github.com/gin-gonic/gin"
)

// SetupRouter configures all the routes for the API
func SetupRouter(solanaClient *solana.Client, portfolioCache *services.PortfolioCache) *gin.Engine {
	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Request-ID")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	portfolioHandler := handlers.NewPortfolioHandler(solanaClient, portfolioCache)
	activityHandler := handlers.NewActivityHandler(solanaClient)

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	v1 := router.Group("/api/v1")
	v1.Use(middleware.RequestID())
	v1.Use(middleware.RateLimitPerIP(120))
	{
		v1.GET("/portfolio/:address", portfolioHandler.GetPortfolio)
		v1.GET("/wallet/:address/activity", activityHandler.GetActivity)
	}

	return router
}
