package ws

import (
	"encoding/json"
	"sync"
	"time"
)

// RoomStateManager manages persistent room states
type RoomStateManager struct {
	states map[string]*RoomStateSnapshot
	mu     sync.RWMutex
	ttl    time.Duration
}

// RoomStateSnapshot represents a saved room state
type RoomStateSnapshot struct {
	RoomCode         string                 `json:"room_code"`
	GameState        *GameState             `json:"game_state"`
	Players          []string               `json:"players"`
	Owner            string                 `json:"owner"`
	SessionToUser    map[string]string      `json:"session_to_user"`
	CreatedAt        time.Time              `json:"created_at"`
	LastActivity     time.Time              `json:"last_activity"`
}

var globalStateManager = &RoomStateManager{
	states: make(map[string]*RoomStateSnapshot),
	ttl:    30 * time.Minute,
}

func GetStateManager() *RoomStateManager {
	return globalStateManager
}

// SaveRoomState saves the current room state
func (rsm *RoomStateManager) SaveRoomState(room *Room) {
	rsm.mu.Lock()
	defer rsm.mu.Unlock()

	room.mu.RLock()
	players := make([]string, 0, len(room.Clients))
	sessionToUser := make(map[string]string)
	
	for client := range room.Clients {
		players = append(players, client.Username)
		if client.SessionID != "" {
			sessionToUser[client.SessionID] = client.Username
		}
	}
	
	// Deep copy game state
	gameStateCopy := *room.GameState
	room.mu.RUnlock()

	snapshot := &RoomStateSnapshot{
		RoomCode:      room.ID,
		GameState:     &gameStateCopy,
		Players:       players,
		Owner:         room.Owner,
		SessionToUser: sessionToUser,
		CreatedAt:     time.Now(),
		LastActivity:  time.Now(),
	}

	rsm.states[room.ID] = snapshot
}

// GetRoomState retrieves a saved room state
func (rsm *RoomStateManager) GetRoomState(roomCode string) *RoomStateSnapshot {
	rsm.mu.RLock()
	defer rsm.mu.RUnlock()

	snapshot, exists := rsm.states[roomCode]
	if !exists {
		return nil
	}

	// Check if expired
	if time.Since(snapshot.LastActivity) > rsm.ttl {
		return nil
	}

	return snapshot
}

// UpdateActivity updates the last activity time
func (rsm *RoomStateManager) UpdateActivity(roomCode string) {
	rsm.mu.Lock()
	defer rsm.mu.Unlock()

	if snapshot, exists := rsm.states[roomCode]; exists {
		snapshot.LastActivity = time.Now()
	}
}

// DeleteRoomState removes a room state
func (rsm *RoomStateManager) DeleteRoomState(roomCode string) {
	rsm.mu.Lock()
	defer rsm.mu.Unlock()

	delete(rsm.states, roomCode)
}

// CleanupExpiredStates removes expired room states
func (rsm *RoomStateManager) CleanupExpiredStates() {
	rsm.mu.Lock()
	defer rsm.mu.Unlock()

	now := time.Now()
	for roomCode, snapshot := range rsm.states {
		if now.Sub(snapshot.LastActivity) > rsm.ttl {
			delete(rsm.states, roomCode)
		}
	}
}

// CheckSessionInRoom checks if a session is already in a room
func (rsm *RoomStateManager) CheckSessionInRoom(roomCode, sessionID string) (bool, string) {
	rsm.mu.RLock()
	defer rsm.mu.RUnlock()

	snapshot, exists := rsm.states[roomCode]
	if !exists {
		return false, ""
	}

	username, found := snapshot.SessionToUser[sessionID]
	return found, username
}

// RestoreRoomState restores a room from snapshot
func (r *Room) RestoreFromSnapshot(snapshot *RoomStateSnapshot) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Restore game state
	if snapshot.GameState != nil {
		r.GameState = snapshot.GameState
	}

	// Restore owner
	r.Owner = snapshot.Owner
}

// SerializeState converts room state to JSON
func (rsm *RoomStateManager) SerializeState(roomCode string) ([]byte, error) {
	rsm.mu.RLock()
	defer rsm.mu.RUnlock()

	snapshot, exists := rsm.states[roomCode]
	if !exists {
		return nil, nil
	}

	return json.Marshal(snapshot)
}

// Start periodic cleanup
func (rsm *RoomStateManager) StartCleanup() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			rsm.CleanupExpiredStates()
		}
	}()
}
