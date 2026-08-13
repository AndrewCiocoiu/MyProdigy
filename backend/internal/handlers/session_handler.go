package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"myprodigy/backend/internal/middleware"
	"myprodigy/backend/internal/models"
	"myprodigy/backend/internal/service"
)

// SessionHandler handles focus session REST endpoints.
type SessionHandler struct {
	sessionService *service.SessionService
}

func NewSessionHandler(sessionService *service.SessionService) *SessionHandler {
	return &SessionHandler{
		sessionService: sessionService,
	}
}

// StartSession handles POST /api/session/start
func (h *SessionHandler) StartSession(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	if !ok || claims.ID == "" {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.StartSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	activeSession, err := h.sessionService.StartSession(r.Context(), claims.ID, req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == service.ErrDurationTooShort || err == service.ErrNotInHousehold || err == service.ErrSessionInProgress {
			status = http.StatusBadRequest
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(activeSession)
}

// JoinSession handles POST /api/session/join
func (h *SessionHandler) JoinSession(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	if !ok || claims.ID == "" {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	activeSession, err := h.sessionService.JoinSession(r.Context(), claims.ID)
	if err != nil {
		status := http.StatusBadRequest
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(activeSession)
}

// EndSession handles POST /api/session/end
func (h *SessionHandler) EndSession(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	if !ok || claims.ID == "" {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	activeSession, err := h.sessionService.EndSession(r.Context(), claims.ID)
	if err != nil {
		status := http.StatusBadRequest
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Session ended successfully",
		"session": activeSession,
	})
}

// GetCurrentSession handles GET /api/session/current
func (h *SessionHandler) GetCurrentSession(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	if !ok || claims.ID == "" {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	activeSession, err := h.sessionService.GetCurrentSession(r.Context(), claims.ID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if activeSession == nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"activeSession": nil})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"activeSession": activeSession})
}

// GetSessionHistory handles GET /api/session/history
func (h *SessionHandler) GetSessionHistory(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	if !ok || claims.ID == "" {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	limit := 50
	offset := 0

	if lStr := r.URL.Query().Get("limit"); lStr != "" {
		if parsed, err := strconv.Atoi(lStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if oStr := r.URL.Query().Get("offset"); oStr != "" {
		if parsed, err := strconv.Atoi(oStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	history, err := h.sessionService.GetSessionHistory(r.Context(), claims.ID, limit, offset)
	if err != nil {
		status := http.StatusInternalServerError
		if err == service.ErrNotInHousehold {
			status = http.StatusBadRequest
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(history)
}
