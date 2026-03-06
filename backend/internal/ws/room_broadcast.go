package ws

import (
	"encoding/json"
	"log"
)

// BroadcastMessage sends a typed message to all clients in the room.
func (r *Room) BroadcastMessage(messageType string, payload interface{}) {
	msg := Message{
		Type:    messageType,
		Payload: payload,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	// Non-blocking send with timeout
	select {
	case r.Broadcast <- data:
	default:
		// Drop message if channel is full to prevent blocking
		log.Printf("Broadcast channel full for room %s, dropping message", r.ID)
	}
}

// BroadcastRoomUpdate sends the current room state to all clients.
func (r *Room) BroadcastRoomUpdate() {
	r.mu.RLock()
	players := make([]string, 0, len(r.Clients))
	for client := range r.Clients {
		if !client.IsSpectator {
			players = append(players, client.Username)
		}
	}
	payload := map[string]interface{}{
		"players":       players,
		"current_count": len(players),
		"status":        string(r.GameState.Status),
		"current_round": r.GameState.CurrentRound,
		"owner":         r.Owner,
		"game_mode":     r.GameState.GameMode,
		"player_colors": r.GameState.PlayerColors,
	}
	r.mu.RUnlock()

	r.BroadcastMessage("room_update", payload)
}

// SendToClient sends a message to a specific client.
func (r *Room) SendToClient(client *Client, messageType string, payload interface{}) {
	msg := Message{
		Type:    messageType,
		Payload: payload,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling client message: %v", err)
		return
	}

	select {
	case client.Send <- data:
	default:
		log.Printf("Client %s send buffer full", client.Username)
	}
}
