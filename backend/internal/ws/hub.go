package ws

import (
	"sync"
)

// Hub manages the active WebSocket connections and routes events to rooms.
type Hub struct {
	// Active connections by room/household ID
	rooms      map[string]map[*Client]bool
	roomsMutex sync.RWMutex

	// Channels for client registration, unregistration, and broadcasting
	register   chan *Client
	unregister chan *Client
	broadcast  chan Message
}

type Message struct {
	RoomID string      `json:"roomId"`
	Event  string      `json:"event"`
	Data   interface{} `json:"data"`
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.roomsMutex.Lock()
			if h.rooms[client.RoomID] == nil {
				h.rooms[client.RoomID] = make(map[*Client]bool)
			}
			h.rooms[client.RoomID][client] = true

			// Snapshot currently online user IDs (excluding the new client)
			onlineUsers := make([]string, 0)
			seenUsers := make(map[string]bool)
			for c := range h.rooms[client.RoomID] {
				if c != client && !seenUsers[c.UserID] {
					onlineUsers = append(onlineUsers, c.UserID)
					seenUsers[c.UserID] = true
				}
			}
			h.roomsMutex.Unlock()

			// Send the new client a "presence_state" snapshot of who is already online.
			// Done in a goroutine to avoid blocking the hub's select loop.
			go func(c *Client, online []string) {
				c.send <- Message{
					RoomID: c.RoomID,
					Event:  "presence_state",
					Data:   map[string]interface{}{"onlineUsers": online},
				}
			}(client, onlineUsers)

			// Broadcast partner_joined to everyone else in the room (goroutine avoids deadlock).
			go h.broadcastToOthers(client.RoomID, client.UserID, "partner_joined", map[string]interface{}{
				"userId": client.UserID,
			})

		case client := <-h.unregister:
			h.roomsMutex.Lock()
			if rooms, ok := h.rooms[client.RoomID]; ok {
				if _, exists := rooms[client]; exists {
					delete(rooms, client)
					close(client.send)
					if len(rooms) == 0 {
						delete(h.rooms, client.RoomID)
					}
				}
			}
			h.roomsMutex.Unlock()

			// Broadcast partner_left ONLY if the user has 0 active connections left in this room.
			// Run in a goroutine to avoid blocking the hub's select loop.
			go func(roomID, userID string) {
				if !h.IsUserOnline(roomID, userID) {
					h.BroadcastToRoom(roomID, "partner_left", map[string]interface{}{
						"userId": userID,
					})
				}
			}(client.RoomID, client.UserID)

		case message := <-h.broadcast:
			h.roomsMutex.RLock()
			clients := h.rooms[message.RoomID]
			for c := range clients {
				select {
				case c.send <- message:
				default:
					close(c.send)
					delete(clients, c)
				}
			}
			h.roomsMutex.RUnlock()
		}
	}
}

// BroadcastToRoom sends a message event to all clients connected in a specific room.
func (h *Hub) BroadcastToRoom(roomID, event string, data interface{}) {
	h.broadcast <- Message{
		RoomID: roomID,
		Event:  event,
		Data:   data,
	}
}

// broadcastToOthers sends a message to all clients in a room except the one with excludeUserID.
func (h *Hub) broadcastToOthers(roomID, excludeUserID, event string, data interface{}) {
	h.roomsMutex.RLock()
	clients := h.rooms[roomID]
	for c := range clients {
		if c.UserID == excludeUserID {
			continue
		}
		select {
		case c.send <- Message{RoomID: roomID, Event: event, Data: data}:
		default:
		}
	}
	h.roomsMutex.RUnlock()
}

// IsUserOnline checks if a user has any active WebSocket connections in a given room.
func (h *Hub) IsUserOnline(roomID, userID string) bool {
	h.roomsMutex.RLock()
	defer h.roomsMutex.RUnlock()

	clients, ok := h.rooms[roomID]
	if !ok {
		return false
	}

	for client := range clients {
		if client.UserID == userID {
			return true
		}
	}

	return false
}

// GetOnlineUserIDs returns distinct user IDs of all clients currently connected in a room.
func (h *Hub) GetOnlineUserIDs(roomID string) []string {
	h.roomsMutex.RLock()
	defer h.roomsMutex.RUnlock()

	clients, ok := h.rooms[roomID]
	if !ok {
		return nil
	}

	seen := make(map[string]bool)
	ids := make([]string, 0, len(clients))
	for c := range clients {
		if !seen[c.UserID] {
			ids = append(ids, c.UserID)
			seen[c.UserID] = true
		}
	}
	return ids
}

