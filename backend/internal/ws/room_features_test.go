package ws

import (
	"testing"
)

func TestSetPlayerColor(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}
	room.Clients[client] = true

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
	room.Clients[client] = true
	room.Clients[&Client{Username: "alice", Send: make(chan []byte, 10)}] = true

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
	room.Clients[client] = true

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
		room.Clients[client] = true
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

func TestSetPlayerColorIgnoresDisconnectedColorReservations(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.mu.Lock()
	room.GameState.PlayerColors["alice"] = "red"
	room.mu.Unlock()

	bob := &Client{
		Username: "bob",
		Send:     make(chan []byte, 10),
	}
	room.Clients[bob] = true

	room.SetPlayerColor(bob, map[string]interface{}{"color": "red"})

	room.mu.RLock()
	defer room.mu.RUnlock()
	if room.GameState.PlayerColors["bob"] != "red" {
		t.Fatalf("bob should be able to reuse a disconnected player's color")
	}
}
