package api

import (
	// Standard library imports for HTTP server, logging, and system signals
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

// Server represents the HTTP server configuration
// It encapsulates the router and port settings
type Server struct {
	router *gin.Engine // Gin router instance for handling HTTP requests
	port   string      // Port number the server will listen on
}

// NewServer creates a new HTTP server instance
// Parameters:
//   - router: configured Gin router with all routes set up
//   - port: port number for the server to listen on
//
// Returns a pointer to the new Server instance
func NewServer(router *gin.Engine, port string) *Server {
	return &Server{
		router: router,
		port:   port,
	}
}

// Start begins the HTTP server with graceful shutdown capabilities
// This method:
// 1. Starts the server in a separate goroutine
// 2. Sets up signal handling for graceful shutdown
// 3. Waits for shutdown signal
// 4. Performs graceful shutdown with timeout
// Returns an error if shutdown fails
func (s *Server) Start() error {
	srv := &http.Server{
		Addr:    ":" + s.port,
		Handler: s.router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", s.port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create context with timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		return err
	}

	log.Println("Server gracefully stopped")
	return nil
}
