package ws

import (
	"log"
	"net/http"

	"myprodigy/backend/internal/middleware"
	"myprodigy/backend/internal/repository"
)

type WSHandler struct {
	hub      *Hub
	userRepo *repository.UserRepository
}

func NewWSHandler(hub *Hub, userRepo *repository.UserRepository) *WSHandler {
	return &WSHandler{hub: hub, userRepo: userRepo}
}

func (h *WSHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	if !ok || claims.ID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WS] Upgrade failed: %v", err)
		return
	}

	roomID := claims.HouseholdID

	// If token claim does not have householdId yet, check repo/query param
	if roomID == "" {
		if user, err := h.userRepo.GetByID(r.Context(), claims.ID); err == nil && user != nil && user.PartnershipID != nil {
			roomID = *user.PartnershipID
		}
	}

	if roomID == "" {
		roomID = "user:" + claims.ID
	}

	log.Printf("[WS] Client connected: UserID=%s RoomID=%s", claims.ID, roomID)

	client := &Client{
		Hub:    h.hub,
		Conn:   conn,
		send:   make(chan Message, 256),
		UserID: claims.ID,
		RoomID: roomID,
	}

	h.hub.register <- client

	go client.WritePump()
	go client.ReadPump()
}
