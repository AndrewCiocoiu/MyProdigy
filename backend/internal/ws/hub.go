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
		broadcast:  make(chan Message),
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
			h.roomsMutex.Unlock()

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

		case message := <-h.broadcast:
			h.roomsMutex.RLock()
			clients := h.rooms[message.RoomID]
			for client := range clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(clients, client)
				}
			}
			h.roomsMutex.RUnlock()
		}
	}
}
