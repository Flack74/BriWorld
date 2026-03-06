package ws

import (
	"briworld/internal/domain"
	"testing"
)

func TestSetPlayerColor(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	payload := map[string]interface{}{
		"color": "red",
	}

	room.SetPlayerColor(client, payload)

	// Verify color set
	room.mu.RLock()
	color := room.GameState.PlayerColors["alice"]
	room.mu.RUnlock()

	if color != "red" {
		t.Errorf("Color = %s, want red", color)
	}
}

func TestSetPlayerColorDuplicatePrevention(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Set first player color
	room.mu.Lock()
	room.GameState.PlayerColors["alice"] = "red"
	room.mu.Unlock()

	// Try to set same color for different player
	client := &Client{
		Username: "bob",
		Send:     make(chan []byte, 10),
	}

	payload := map[string]interface{}{
		"color": "red",
	}

	room.SetPlayerColor(client, payload)

	// Verify bob didn't get the color
	room.mu.RLock()
	bobColor := room.GameState.PlayerColors["bob"]
	room.mu.RUnlock()

	if bobColor == "red" {
		t.Error("Duplicate color was allowed")
	}
}

func TestSetPlayerColorChange(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	// Set initial color
	room.SetPlayerColor(client, map[string]interface{}{"color": "red"})

	// Change color
	room.SetPlayerColor(client, map[string]interface{}{"color": "blue"})

	// Verify color changed
	room.mu.RLock()
	color := room.GameState.PlayerColors["alice"]
	room.mu.RUnlock()

	if color != "blue" {
		t.Errorf("Color = %s, want blue", color)
	}
}

func TestBroadcastChatMessage(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	payload := map[string]interface{}{
		"message": "Hello world",
	}

	room.BroadcastChatMessage("alice", payload)

	// Message should be broadcast (check channel)
	// This is a basic test - full test would verify message content
}

func TestSwitchTeam(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.Status = domain.RoomWaiting
	room.GameState.GameMode = "TEAM_BATTLE"

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	payload := map[string]interface{}{
		"team": "RED",
	}

	room.SwitchTeam(client, payload)

	// Verify team set
	room.mu.RLock()
	team := room.GameState.Teams["alice"]
	room.mu.RUnlock()

	if team != "RED" {
		t.Errorf("Team = %s, want RED", team)
	}
}

func TestSwitchTeamWrongMode(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.Status = domain.RoomWaiting
	room.GameState.GameMode = "FLAG_QUIZ"

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	payload := map[string]interface{}{
		"team": "RED",
	}

	room.SwitchTeam(client, payload)

	// Team should not be set
	room.mu.RLock()
	team := room.GameState.Teams["alice"]
	room.mu.RUnlock()

	if team != "" {
		t.Error("Team set in non-TEAM_BATTLE mode")
	}
}

func TestSwitchTeamGameStarted(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.Status = domain.RoomInProgress
	room.GameState.GameMode = "TEAM_BATTLE"

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	payload := map[string]interface{}{
		"team": "RED",
	}

	room.SwitchTeam(client, payload)

	// Team should not be set after game started
	room.mu.RLock()
	team := room.GameState.Teams["alice"]
	room.mu.RUnlock()

	if team != "" {
		t.Error("Team switch allowed after game started")
	}
}

func TestSwitchTeamInvalidTeam(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.Status = domain.RoomWaiting
	room.GameState.GameMode = "TEAM_BATTLE"

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	payload := map[string]interface{}{
		"team": "INVALID",
	}

	room.SwitchTeam(client, payload)

	// Invalid team should not be set
	room.mu.RLock()
	team := room.GameState.Teams["alice"]
	room.mu.RUnlock()

	if team == "INVALID" {
		t.Error("Invalid team was accepted")
	}
}

func TestMultiplePlayerColors(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	colors := map[string]string{
		"alice":   "red",
		"bob":     "blue",
		"charlie": "green",
	}

	for username, color := range colors {
		client := &Client{
			Username: username,
			Send:     make(chan []byte, 10),
		}
		room.SetPlayerColor(client, map[string]interface{}{"color": color})
	}

	// Verify all colors set
	room.mu.RLock()
	for username, expectedColor := range colors {
		actualColor := room.GameState.PlayerColors[username]
		if actualColor != expectedColor {
			t.Errorf("%s color = %s, want %s", username, actualColor, expectedColor)
		}
	}
	room.mu.RUnlock()
}
