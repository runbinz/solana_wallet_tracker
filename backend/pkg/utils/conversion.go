package utils

import (
	"math"
)

// LamportsToSol converts lamports (Solana's smallest unit) to SOL
// Parameters:
//   - lamports: amount in lamports (1 SOL = 1e9 lamports)
//
// Returns: equivalent amount in SOL as float64
func LamportsToSol(lamports uint64) float64 {
	return float64(lamports) / math.Pow10(9)
}

// SolToLamports converts SOL to lamports
// Parameters:
//   - sol: amount in SOL
//
// Returns: equivalent amount in lamports as uint64
func SolToLamports(sol float64) uint64 {
	return uint64(sol * math.Pow10(9))
}

// FormatBalance formats a token balance with proper decimal places
// Parameters:
//   - balance: the token balance to format
//   - decimals: number of decimal places to round to
//
// Returns: formatted balance with specified decimal precision
func FormatBalance(balance float64, decimals int) float64 {
	multiplier := math.Pow10(decimals)
	return math.Round(balance*multiplier) / multiplier
}
