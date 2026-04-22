package handlers

import (
	"net/http"
	"portfolio-tracker/internal/solana"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// ActivityHandler serves recent signature activity for a wallet.
type ActivityHandler struct {
	solanaClient *solana.Client
}

// NewActivityHandler constructs ActivityHandler.
func NewActivityHandler(solanaClient *solana.Client) *ActivityHandler {
	return &ActivityHandler{solanaClient: solanaClient}
}

// GetActivity handles GET /api/v1/wallet/:address/activity?limit=&before=
func (h *ActivityHandler) GetActivity(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "wallet address is required"})
		return
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit"})
		return
	}
	before := c.Query("before")

	resp, err := h.solanaClient.GetWalletActivity(c.Request.Context(), address, limit, before)
	if err != nil {
		msg := err.Error()
		if msg == "invalid wallet address" || strings.Contains(msg, "invalid before signature") {
			c.JSON(http.StatusBadRequest, gin.H{"error": msg})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, resp)
}
