package handlers

import (
	"net/http"
)

// AuthHandler handles authentication requests from the Next.js frontend.
type AuthHandler struct {
	// dependencies like services can be injected here
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// Parse request, call Auth Service, return JWT or user info
	w.WriteHeader(http.StatusNotImplemented)
	w.Write([]byte(`{"message": "Not implemented"}`))
}
