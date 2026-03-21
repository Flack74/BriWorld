package ws

import (
	"encoding/json"
	"log"
)

func cloneStringIntMap(src map[string]int) map[string]int {
	if src == nil {
		return map[string]int{}
	}
	dst := make(map[string]int, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

func cloneStringStringMap(src map[string]string) map[string]string {
	if src == nil {
		return map[string]string{}
	}
	dst := make(map[string]string, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

func cloneStringBoolMap(src map[string]bool) map[string]bool {
	if src == nil {
		return map[string]bool{}
	}
	dst := make(map[string]bool, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

func (r *Room) BuildStatePayload() map[string]interface{} {
	r.mu.RLock()
	defer r.mu.RUnlock()

	players := make([]string, 0, len(r.Clients))
	playerAvatars := make(map[string]string)
	for client := range r.Clients {
		if client.IsSpectator {
			continue
		}
		players = append(players, client.Username)
		if client.AvatarURL != "" {
			playerAvatars[client.Username] = client.AvatarURL
		}
	}

	return map[string]interface{}{
		"status":            r.GameState.Status,
		"current_round":     r.GameState.CurrentRound,
		"total_rounds":      r.GameState.TotalRounds,
		"question":          r.GameState.Question,
		"scores":            cloneStringIntMap(r.GameState.Scores),
		"time_remaining":    r.GameState.TimeRemaining,
		"game_mode":         r.GameState.GameMode,
		"room_type":         r.GameState.RoomType,
		"map_mode":          r.GameState.MapMode,
		"owner":             r.Owner,
		"players":           players,
		"current_count":     len(players),
		"player_colors":     cloneStringStringMap(r.GameState.PlayerColors),
		"player_avatars":    playerAvatars,
		"painted_countries": cloneStringStringMap(r.GameState.PaintedCountries),
		"answered":          cloneStringBoolMap(r.GameState.Answered),
		"eliminated_players": cloneStringBoolMap(
			r.GameState.EliminatedPlayers,
		),
	}
}

func (r *Room) BroadcastStateSnapshot() {
	r.BroadcastMessage("state_snapshot", r.BuildStatePayload())
}

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
	playerAvatars := make(map[string]string)
	for client := range r.Clients {
		if !client.IsSpectator {
			players = append(players, client.Username)
			if client.AvatarURL != "" {
				playerAvatars[client.Username] = client.AvatarURL
			}
		}
	}
	payload := map[string]interface{}{
		"players":       players,
		"current_count": len(players),
		"status":        string(r.GameState.Status),
		"current_round": r.GameState.CurrentRound,
		"owner":         r.Owner,
		"game_mode":     r.GameState.GameMode,
		"room_type":     r.GameState.RoomType,
		"map_mode":      r.GameState.MapMode,
		"scores":        cloneStringIntMap(r.GameState.Scores),
		"player_colors": r.GameState.PlayerColors,
		"player_avatars": playerAvatars,
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
