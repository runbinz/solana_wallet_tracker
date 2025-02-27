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
	err := godotenv.Load()
	if err != nil {
		return nil, err
	}

	return &Config{
		SolanaRPCURL: os.Getenv("SOLANA_RPC_URL"),
		Port:         os.Getenv("PORT"),
	}, nil
}
