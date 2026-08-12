package handlers

import (
	"net/http"
)

// SessionHandler handles focus session requests (REST endpoints).
type SessionHandler struct {
	// dependencies like services can be injected here
}

func NewSessionHandler() *SessionHandler {
	return &SessionHandler{}
}

func (h *SessionHandler) CreateSoloSession(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

func (h *SessionHandler) CreateJointSession(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}
