package services

import (
	"sync"
	"time"

	"portfolio-tracker/internal/models"
)

// PortfolioCache holds short-TTL snapshots of portfolio responses by wallet address.
type PortfolioCache struct {
	mu    sync.RWMutex
	items map[string]struct {
		p *models.Portfolio
		e time.Time
	}
	ttl time.Duration
}

// NewPortfolioCache returns a cache with the given time-to-live per entry.
func NewPortfolioCache(ttl time.Duration) *PortfolioCache {
	return &PortfolioCache{
		items: make(map[string]struct {
			p *models.Portfolio
			e time.Time
		}),
		ttl: ttl,
	}
}

// Get returns a deep copy of a cached portfolio if still valid.
func (c *PortfolioCache) Get(address string) (*models.Portfolio, bool) {
	if c == nil || address == "" {
		return nil, false
	}
	now := time.Now()
	c.mu.RLock()
	ent, ok := c.items[address]
	c.mu.RUnlock()
	if !ok || now.After(ent.e) || ent.p == nil {
		return nil, false
	}
	return clonePortfolio(ent.p), true
}

// Set stores a copy of the portfolio for the wallet address.
func (c *PortfolioCache) Set(address string, p *models.Portfolio) {
	if c == nil || address == "" || p == nil {
		return
	}
	cp := clonePortfolio(p)
	c.mu.Lock()
	c.items[address] = struct {
		p *models.Portfolio
		e time.Time
	}{p: cp, e: time.Now().Add(c.ttl)}
	c.mu.Unlock()
}

func clonePortfolio(p *models.Portfolio) *models.Portfolio {
	if p == nil {
		return nil
	}
	out := &models.Portfolio{
		WalletAddress: p.WalletAddress,
		TotalValue:    p.TotalValue,
		Tokens:        make([]models.TokenHolding, len(p.Tokens)),
	}
	copy(out.Tokens, p.Tokens)
	return out
}
