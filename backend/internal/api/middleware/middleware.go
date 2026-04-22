package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/time/rate"
)

// RequestID ensures each response has an X-Request-ID (generated if missing).
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-Request-ID")
		if id == "" {
			id = uuid.New().String()
		}
		c.Writer.Header().Set("X-Request-ID", id)
		c.Next()
	}
}

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// RateLimitPerIP allows up to `burst` immediate requests then refills at `requestsPerMinute` per minute.
func RateLimitPerIP(requestsPerMinute int) gin.HandlerFunc {
	var mu sync.Mutex
	byIP := make(map[string]*visitor)
	go func() {
		t := time.NewTicker(5 * time.Minute)
		for range t.C {
			mu.Lock()
			now := time.Now()
			for ip, v := range byIP {
				if now.Sub(v.lastSeen) > 10*time.Minute {
					delete(byIP, ip)
				}
			}
			mu.Unlock()
		}
	}()

	rps := rate.Limit(float64(requestsPerMinute) / 60.0)
	return func(c *gin.Context) {
		ip := c.ClientIP()
		mu.Lock()
		v, ok := byIP[ip]
		if !ok {
			v = &visitor{limiter: rate.NewLimiter(rps, requestsPerMinute)}
			byIP[ip] = v
		}
		v.lastSeen = time.Now()
		lim := v.limiter
		mu.Unlock()

		if !lim.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			return
		}
		c.Next()
	}
}
