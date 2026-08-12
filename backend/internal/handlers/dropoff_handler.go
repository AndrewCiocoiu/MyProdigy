package handlers

import (
	"net/http"
)

// DropoffHandler handles porch drop-offs (leaving materials/notes for the partner).
type DropoffHandler struct {
	// dependencies like services can be injected here
}

func NewDropoffHandler() *DropoffHandler {
	return &DropoffHandler{}
}

func (h *DropoffHandler) CreateDropoff(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

func (h *DropoffHandler) GetUnreadDropoffs(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}
