package solana

import (
	"context"
	"time"
)

func rpcRetry[T any](ctx context.Context, attempts int, fn func() (T, error)) (T, error) {
	var zero T
	var lastErr error
	for i := 0; i < attempts; i++ {
		if i > 0 {
			t := time.NewTimer(time.Duration(200*i) * time.Millisecond)
			select {
			case <-ctx.Done():
				t.Stop()
				return zero, ctx.Err()
			case <-t.C:
			}
		}
		v, err := fn()
		if err == nil {
			return v, nil
		}
		lastErr = err
	}
	return zero, lastErr
}
