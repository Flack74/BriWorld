package ws

import (
	"encoding/json"
	"log"
	"sync"
)

type Spectator struct {
	Username string
	Send     chan []byte
	Room     *Room
	mu       sync.RWMutex
}

type SpectatorManager struct {
	spectators map[string]map[*Spectator]bool // roomID -> spectators
	mu         sync.RWMutex
}

var GlobalSpectatorManager = &SpectatorManager{
	spectators: make(map[string]map[*Spectator]bool),
}

func (sm *SpectatorManager) AddSpectator(roomID string, spectator *Spectator) {
	sm.mu.Lock()
	if sm.spectators[roomID] == nil {
		sm.spectators[roomID] = make(map[*Spectator]bool)
	}
	sm.spectators[roomID][spectator] = true
	sm.mu.Unlock()
	
	log.Printf("Spectator %s joined room %s", spectator.Username, roomID)
	
	// Send current game state
	if room := GlobalHub.GetRoom(roomID); room != nil {
		room.mu.RLock()
		state := map[string]interface{}{
			"status":        room.GameState.Status,
			"current_round": room.GameState.CurrentRound,
			"total_rounds":  room.GameState.TotalRounds,
			"scores":        room.GameState.Scores,
			"game_mode":     room.GameState.GameMode,
			"players":       len(room.Clients),
		}
		room.mu.RUnlock()
		
		msg := Message{Type: "spectator_joined", Payload: state}
		data, _ := json.Marshal(msg)
		spectator.Send <- data
	}
}

func (sm *SpectatorManager) RemoveSpectator(roomID string, spectator *Spectator) {
	sm.mu.Lock()
	if sm.spectators[roomID] != nil {
		delete(sm.spectators[roomID], spectator)
		if len(sm.spectators[roomID]) == 0 {
			delete(sm.spectators, roomID)
		}
	}
	sm.mu.Unlock()
	
	log.Printf("Spectator %s left room %s", spectator.Username, roomID)
}

func (sm *SpectatorManager) BroadcastToSpectators(roomID string, msgType string, payload interface{}) {
	sm.mu.RLock()
	spectators := sm.spectators[roomID]
	sm.mu.RUnlock()
	
	if spectators == nil {
		return
	}
	
	msg := Message{Type: msgType, Payload: payload}
	data, _ := json.Marshal(msg)
	
	for spectator := range spectators {
		select {
		case spectator.Send <- data:
		default:
			close(spectator.Send)
			sm.RemoveSpectator(roomID, spectator)
		}
	}
}

func (r *Room) BroadcastWithSpectators(msgType string, payload interface{}) {
	r.BroadcastMessage(msgType, payload)
	GlobalSpectatorManager.BroadcastToSpectators(r.ID, msgType, payload)
}
