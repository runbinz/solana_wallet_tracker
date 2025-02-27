package main

import (
	"log"
	"portfolio-tracker/config"
	"portfolio-tracker/internal/api"
	"portfolio-tracker/internal/solana"
)

// main is the entry point of the application
// It performs the following steps:
// 1. Loads configuration from environment
// 2. Initializes Solana client
// 3. Sets up HTTP router
// 4. Starts the server
func main() {
	// Load configuration, gets setting from .env file
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize Solana client
	solanaClient := solana.NewClient(cfg.SolanaRPCURL)

	// Setup router
	router := api.SetupRouter(solanaClient)

	server := api.NewServer(router, cfg.Port)
	if err := server.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
