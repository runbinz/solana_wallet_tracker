package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const (
	jupiterPriceV3  = "https://api.jup.ag/price/v3"
	jupiterSearchV2 = "https://api.jup.ag/tokens/v2/search"
	priceCacheTTL   = 45 * time.Second
	metaCacheTTL    = 24 * time.Hour
	priceChunkSize  = 80
)

// MintQuote is USD market data for one mint from Jupiter Price API v3.
type MintQuote struct {
	USDPrice       float64
	PriceChange24h float64
	Decimals       int
	FetchedAt      time.Time
}

// JupiterClient fetches token metadata and USD prices from Jupiter public APIs.
type JupiterClient struct {
	httpClient *http.Client
	priceMu    sync.RWMutex
	priceCache map[string]struct {
		q MintQuote
		e time.Time
	}
	metaMu    sync.RWMutex
	metaCache map[string]struct {
		symbol, name, logo string
		decimals            int
		expires             time.Time
	}
}

// NewJupiterClient builds a client with in-memory quote and metadata caches.
func NewJupiterClient() *JupiterClient {
	return &JupiterClient{
		httpClient: &http.Client{Timeout: 20 * time.Second},
		priceCache: make(map[string]struct {
			q MintQuote
			e time.Time
		}),
		metaCache: make(map[string]struct {
			symbol, name, logo string
			decimals            int
			expires             time.Time
		}),
	}
}

type jupiterPriceV3Entry struct {
	UsdPrice       float64 `json:"usdPrice"`
	PriceChange24h float64 `json:"priceChange24h"`
	Decimals       int     `json:"decimals"`
}

// FetchUSDQuotes returns USD price, 24h change, and decimals for the given mints (batch HTTP).
func (j *JupiterClient) FetchUSDQuotes(mints []string) (map[string]MintQuote, error) {
	if len(mints) == 0 {
		return map[string]MintQuote{}, nil
	}

	now := time.Now()
	out := make(map[string]MintQuote, len(mints))
	var need []string
	for _, m := range mints {
		if m == "" {
			continue
		}
		j.priceMu.RLock()
		ent, ok := j.priceCache[m]
		j.priceMu.RUnlock()
		if ok && now.Before(ent.e) {
			out[m] = ent.q
			continue
		}
		need = append(need, m)
	}

	for i := 0; i < len(need); i += priceChunkSize {
		end := i + priceChunkSize
		if end > len(need) {
			end = len(need)
		}
		chunk := need[i:end]
		ids := strings.Join(chunk, ",")
		reqURL := jupiterPriceV3 + "?ids=" + ids
		req, err := http.NewRequest(http.MethodGet, reqURL, nil)
		if err != nil {
			return nil, err
		}
		resp, err := j.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("jupiter price v3: status %d: %s", resp.StatusCode, string(body))
		}
		var parsed map[string]jupiterPriceV3Entry
		if err := json.Unmarshal(body, &parsed); err != nil {
			return nil, fmt.Errorf("jupiter price v3 decode: %w", err)
		}
		fetched := time.Now().UTC()
		for mint, row := range parsed {
			q := MintQuote{
				USDPrice:       row.UsdPrice,
				PriceChange24h: row.PriceChange24h,
				Decimals:       row.Decimals,
				FetchedAt:      fetched,
			}
			out[mint] = q
			j.priceMu.Lock()
			j.priceCache[mint] = struct {
				q MintQuote
				e time.Time
			}{q: q, e: now.Add(priceCacheTTL)}
			j.priceMu.Unlock()
		}
	}
	return out, nil
}

type jupiterSearchToken struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Symbol   string `json:"symbol"`
	Icon     string `json:"icon"`
	Decimals int    `json:"decimals"`
}

// LookupMetadata resolves symbol, name, logo, and decimals using search-by-mint (cached).
func (j *JupiterClient) LookupMetadata(mint string) (symbol, name, logo string, decimals int, ok bool) {
	now := time.Now()
	j.metaMu.RLock()
	ent, hit := j.metaCache[mint]
	j.metaMu.RUnlock()
	if hit && now.Before(ent.expires) {
		return ent.symbol, ent.name, ent.logo, ent.decimals, ent.symbol != "" || ent.name != ""
	}

	reqURL := jupiterSearchV2 + "?query=" + url.QueryEscape(mint)
	req, err := http.NewRequest(http.MethodGet, reqURL, nil)
	if err != nil {
		return "", "", "", 0, false
	}
	resp, err := j.httpClient.Do(req)
	if err != nil {
		return "", "", "", 0, false
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil || resp.StatusCode != http.StatusOK {
		return "", "", "", 0, false
	}
	var list []jupiterSearchToken
	if err := json.Unmarshal(body, &list); err != nil {
		return "", "", "", 0, false
	}
	for _, t := range list {
		if t.ID == mint {
			j.metaMu.Lock()
			j.metaCache[mint] = struct {
				symbol, name, logo string
				decimals            int
				expires             time.Time
			}{
				symbol:   t.Symbol,
				name:     t.Name,
				logo:     t.Icon,
				decimals: t.Decimals,
				expires:  now.Add(metaCacheTTL),
			}
			j.metaMu.Unlock()
			return t.Symbol, t.Name, t.Icon, t.Decimals, true
		}
	}
	// Negative cache short TTL to avoid hammering unknown mints
	j.metaMu.Lock()
	j.metaCache[mint] = struct {
		symbol, name, logo string
		decimals            int
		expires             time.Time
	}{expires: now.Add(10 * time.Minute)}
	j.metaMu.Unlock()
	return "", "", "", 0, false
}
