package models

// ActivityItem is one row for recent on-chain activity (signature-level).
type ActivityItem struct {
	Signature            string `json:"signature"`
	Slot                 uint64 `json:"slot"`
	BlockTime            *int64 `json:"block_time,omitempty"`
	Success              bool   `json:"success"`
	ErrorSummary         string `json:"error_summary,omitempty"`
	Memo                 string `json:"memo,omitempty"`
	SolscanURL           string `json:"solscan_url"`
	ConfirmationStatus string `json:"confirmation_status,omitempty"`
}

// ActivityResponse is returned by GET /api/v1/wallet/:address/activity
type ActivityResponse struct {
	WalletAddress string         `json:"wallet_address"`
	Items         []ActivityItem `json:"items"`
	NextBefore    string         `json:"next_before,omitempty"`
}
