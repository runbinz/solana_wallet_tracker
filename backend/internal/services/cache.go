package services

import (
	"sync"
	"time"
)

// PriceCache implements a simple in-memory cache for token prices
// Uses a mutex for thread-safe operations and includes expiration times
type PriceCache struct {
	cache map[string]cachedPrice // Map of token symbols to cached prices
	mu    sync.RWMutex           // Read-write mutex for thread safety
}

// cachedPrice represents a price entry in the cache with expiration
type cachedPrice struct {
	price     float64   // The cached price value
	expiresAt time.Time // Timestamp when this cache entry expires
}

// NewPriceCache creates a new price cache instance
// Returns: initialized PriceCache with empty cache map
func NewPriceCache() *PriceCache {
	return &PriceCache{
		cache: make(map[string]cachedPrice),
	}
}

// Get returns a cached price if available and not expired
// Parameters:
//   - symbol: token symbol to look up
//
// Returns:
//   - price: cached price value
//   - bool: true if valid cache hit, false if not found or expired
func (c *PriceCache) Get(symbol string) (float64, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.cache[symbol]
	if !exists || time.Now().After(item.expiresAt) {
		return 0, false
	}

	return item.price, true
}

// Set adds or updates a price in the cache
// Parameters:
//   - symbol: token symbol to cache
//   - price: price value to cache
//   - ttl: time-to-live duration for this cache entry
func (c *PriceCache) Set(symbol string, price float64, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cache[symbol] = cachedPrice{
		price:     price,
		expiresAt: time.Now().Add(ttl),
	}
}
