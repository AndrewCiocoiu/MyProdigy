package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	customMiddleware "myprodigy/backend/internal/middleware"
	"myprodigy/backend/internal/handlers"
	"myprodigy/backend/internal/repository"
	"myprodigy/backend/internal/service"
	"myprodigy/backend/internal/ws"
)

func main() {
	// Load environment variables from .env file if it exists (primarily for local development)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	log.Printf("Starting backend server on port %s", port)

	// Create root router
	r := chi.NewRouter()

	// Standard middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not exceeded by browsers
	}))

	// Database connection
	ctx, cancelDB := context.WithTimeout(context.Background(), 10*time.Second)
	db, err := repository.Connect(ctx)
	cancelDB()
	if err != nil {
		log.Printf("Warning: Failed to connect to DB: %v (Auth endpoints requiring DB will fail until DB is ready)", err)
	} else {
		defer db.Close()
		log.Println("Database connection pool initialized")
	}

	// Initialize WebSocket Hub
	hub := ws.NewHub()
	go hub.Run()
	var wsHandler *ws.WSHandler

	// Dependencies setup
	var userRepo *repository.UserRepository
	var authService *service.AuthService
	var authHandler *handlers.AuthHandler
	var householdRepo *repository.HouseholdRepository
	var householdService *service.HouseholdService
	var householdHandler *handlers.HouseholdHandler
	var sessionRepo *repository.SessionRepository
	var sessionService *service.SessionService
	var sessionHandler *handlers.SessionHandler

	if db != nil {
		userRepo = repository.NewUserRepository(db)
		wsHandler = ws.NewWSHandler(hub, userRepo)
		authService = service.NewAuthService(userRepo)
		authHandler = handlers.NewAuthHandler(authService)
		householdRepo = repository.NewHouseholdRepository(db)
		householdService = service.NewHouseholdService(householdRepo, userRepo, hub)
		householdHandler = handlers.NewHouseholdHandler(householdService)
		sessionRepo = repository.NewSessionRepository(db)
		sessionService = service.NewSessionService(sessionRepo, householdRepo, userRepo, hub)
		sessionHandler = handlers.NewSessionHandler(sessionService)
	}

	// Health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   "1.0.0",
		})
	})

	// Auth routes
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", func(w http.ResponseWriter, r *http.Request) {
			if authHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			authHandler.Register(w, r)
		})
		r.Post("/login", func(w http.ResponseWriter, r *http.Request) {
			if authHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			authHandler.Login(w, r)
		})
	})

	// Household routes (Protected by AuthMiddleware)
	r.Route("/api/household", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)

		r.Get("/status", func(w http.ResponseWriter, r *http.Request) {
			if householdHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			householdHandler.GetStatus(w, r)
		})
		r.Post("/invite", func(w http.ResponseWriter, r *http.Request) {
			if householdHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			householdHandler.GenerateInvite(w, r)
		})
		r.Post("/join", func(w http.ResponseWriter, r *http.Request) {
			if householdHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			householdHandler.JoinHousehold(w, r)
		})
		r.Post("/leave", func(w http.ResponseWriter, r *http.Request) {
			if householdHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			householdHandler.LeaveHousehold(w, r)
		})
	})

	// Focus Session routes (Protected by AuthMiddleware)
	r.Route("/api/session", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)

		r.Get("/current", func(w http.ResponseWriter, r *http.Request) {
			if sessionHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			sessionHandler.GetCurrentSession(w, r)
		})
		r.Get("/history", func(w http.ResponseWriter, r *http.Request) {
			if sessionHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			sessionHandler.GetSessionHistory(w, r)
		})
		r.Post("/start", func(w http.ResponseWriter, r *http.Request) {
			if sessionHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			sessionHandler.StartSession(w, r)
		})
		r.Post("/join", func(w http.ResponseWriter, r *http.Request) {
			if sessionHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			sessionHandler.JoinSession(w, r)
		})
		r.Post("/end", func(w http.ResponseWriter, r *http.Request) {
			if sessionHandler == nil {
				http.Error(w, `{"message":"Database connection unavailable"}`, http.StatusServiceUnavailable)
				return
			}
			sessionHandler.EndSession(w, r)
		})
	})

	// WebSocket route (Protected by AuthMiddleware)
	if wsHandler != nil {
		r.With(customMiddleware.AuthMiddleware).Get("/ws", wsHandler.ServeWS)
	}

	// Setup Server
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to listen for interrupts to gracefully shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Run server in a goroutine so that it doesn't block.
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe failed: %s", err)
		}
	}()

	log.Println("Server is running...")

	// Block until we receive our signal.
	<-shutdown
	log.Println("Shutting down server...")

	// Create a deadline to wait for.
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Doesn't block if no connections, but will otherwise wait
	// until the timeout deadline.
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server graceful shutdown failed: %s", err)
	}

	log.Println("Server gracefully stopped")
}
