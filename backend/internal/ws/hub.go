package ws

import (
	"briworld/internal/domain"
	"sync"
)

func getMaxPlayersForMode(mode string) int {
	if mode == "TEAM_BATTLE" {
		return 10
	}
	return 6
}

type Hub struct {
	rooms           map[string]*Room
	register        chan *Client
	unregister      chan *Client
	mu              sync.RWMutex
	publicRoomsCache []map[string]interface{}
	lastCacheTime   int64
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
	} else {
		room.mu.RLock()
		isClosed := room.GameState.Status == domain.RoomClosed || room.isCleanedUp
		isCompleted := room.GameState.Status == domain.RoomCompleted
		isEmpty := len(room.Clients) == 0
		room.mu.RUnlock()

		if isClosed {
			// Room was closed/cleaned up, reject reconnection
			return nil
		}

		// If room is completed and empty, allow reuse by creating new room
		if isCompleted && isEmpty {
			// Clean up old room
			room.cancel()
			delete(h.rooms, roomCode)
			// Create fresh room
			room = NewRoom(roomCode)
			h.rooms[roomCode] = room
			go room.Run()
		}
	}
	return room
}

func (h *Hub) RemoveRoom(roomCode string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.rooms, roomCode)
}

func (h *Hub) GetRoom(roomCode string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[roomCode]
}

func (h *Hub) GetPublicRooms(gameMode string) []map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	publicRooms := make([]map[string]interface{}, 0, len(h.rooms)/2)
	for code, room := range h.rooms {
		room.mu.RLock()
		isWaiting := room.GameState.Status == domain.RoomWaiting
		isInProgress := room.GameState.Status == domain.RoomInProgress
		playerCount := 0
		for c := range room.Clients {
			if !c.IsSpectator {
				playerCount++
			}
		}
		
		if room.GameState.RoomType == "PUBLIC" &&
			(isWaiting || isInProgress) &&
			playerCount > 0 &&
			playerCount < getMaxPlayersForMode(room.GameState.GameMode) &&
			!room.isCleanedUp &&
			(gameMode == "" || room.GameState.GameMode == gameMode) {
			maxPlayers := getMaxPlayersForMode(room.GameState.GameMode)
			publicRooms = append(publicRooms, map[string]interface{}{
				"id":         code,
				"host":       room.Owner,
				"players":    playerCount,
				"maxPlayers": maxPlayers,
				"mode":       room.GameState.GameMode,
				"status":     string(room.GameState.Status),
			})
		}
		room.mu.RUnlock()
	}
	return publicRooms
}
