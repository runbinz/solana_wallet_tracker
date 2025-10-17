// Package config provides configuration management for the application
package config

import (
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration settings for the application
// These settings are typically loaded from environment variables
type Config struct {
	SolanaRPCURL string // URL endpoint for Solana RPC node connection
	Port         string // HTTP port number for the API server
}

// LoadConfig initializes and returns the application configuration
// This function:
// 1. Loads environment variables from .env file
// 2. Populates the Config struct with settings
//
// Returns:
//   - *Config: Pointer to populated Config struct
//   - error: Any error encountered during loading
func LoadConfig() (*Config, error) {
	_ = godotenv.Load()

	return &Config{
		SolanaRPCURL: getEnvOrDefault("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"),
		Port:         getEnvOrDefault("PORT", "8080"),
	}, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
