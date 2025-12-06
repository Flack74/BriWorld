package ws

import (
	"sync"
)

type Hub struct {
	rooms      map[string]*Room
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]*Room),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			room := h.rooms[client.RoomID]
			if room != nil {
				room.AddClient(client)
			}
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			room := h.rooms[client.RoomID]
			if room != nil {
				room.RemoveClient(client)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) GetOrCreateRoom(roomCode string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.rooms[roomCode]
	if !exists {
		room = NewRoom(roomCode)
		h.rooms[roomCode] = room
		go room.Run()
	}
	return room
}

func (h *Hub) GetRoom(roomCode string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[roomCode]
}

func (h *Hub) GetPublicRooms(gameMode string) []map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	var publicRooms []map[string]interface{}
	for code, room := range h.rooms {
		room.mu.RLock()
		if room.GameState.RoomType == "PUBLIC" && room.GameState.GameMode == gameMode && room.GameState.Status == "waiting" {
			publicRooms = append(publicRooms, map[string]interface{}{
				"code":        code,
				"players":     len(room.Clients),
				"max_players": 6,
				"mode":        room.GameState.GameMode,
				"status":      room.GameState.Status,
			})
		}
		room.mu.RUnlock()
	}
	return publicRooms
}
