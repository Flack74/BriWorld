package ws

import (
	"briworld/internal/game"
	"briworld/internal/domain"
	"encoding/json"
	"testing"
	"time"
)

func TestHandleAnswer(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Set up game state
	room.GameState.Status = domain.RoomInProgress
	room.GameState.RoundActive = true
	room.GameState.Question = &game.Question{
		Type:        "flag",
		CountryName: "France",
		CountryCode: "FR",
	}
	room.GameState.Scores["alice"] = 0
	room.GameState.TimeRemaining = 10

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	// Test correct answer
	payload := map[string]interface{}{
		"answer": "France",
	}

	room.HandleAnswer(client, payload)

	// Verify answer was recorded
	if !room.GameState.Answered["alice"] {
		t.Error("Answer not recorded")
	}

	// Verify score increased
	if room.GameState.Scores["alice"] <= 0 {
		t.Error("Score not updated for correct answer")
	}
}

func TestHandleAnswerAlreadyAnswered(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.RoundActive = true
	room.GameState.Answered["alice"] = true
	room.GameState.Scores["alice"] = 50

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	payload := map[string]interface{}{
		"answer": "France",
	}

	initialScore := room.GameState.Scores["alice"]
	room.HandleAnswer(client, payload)

	// Score should not change
	if room.GameState.Scores["alice"] != initialScore {
		t.Error("Score changed for already answered player")
	}
}

func TestHandleAnswerRoundNotActive(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.RoundActive = false
	room.GameState.Scores["alice"] = 0

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	payload := map[string]interface{}{
		"answer": "France",
	}

	room.HandleAnswer(client, payload)

	// Answer should not be recorded
	if room.GameState.Answered["alice"] {
		t.Error("Answer recorded when round not active")
	}
}

func TestBroadcastMessage(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Add client
	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}
	room.mu.Lock()
	room.Clients[client] = true
	room.mu.Unlock()

	// Broadcast message
	room.BroadcastMessage("test_type", map[string]interface{}{
		"data": "test",
	})

	// Wait for broadcast
	select {
	case msg := <-room.Broadcast:
		var decoded Message
		if err := json.Unmarshal(msg, &decoded); err != nil {
			t.Fatalf("Failed to decode message: %v", err)
		}
		if decoded.Type != "test_type" {
			t.Errorf("Message type = %s, want test_type", decoded.Type)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Message not broadcast")
	}
}

func TestBroadcastRoomUpdate(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.Owner = "alice"
	room.GameState.GameMode = "FLAG_QUIZ"

	client := &Client{
		Username:  "alice",
		AvatarURL: "http://example.com/avatar.png",
		IsGuest:   false,
		Send:      make(chan []byte, 10),
	}
	room.mu.Lock()
	room.Clients[client] = true
	room.mu.Unlock()

	room.BroadcastRoomUpdate()

	// Verify message was broadcast
	select {
	case msg := <-room.Broadcast:
		var decoded Message
		if err := json.Unmarshal(msg, &decoded); err != nil {
			t.Fatalf("Failed to decode message: %v", err)
		}
		if decoded.Type != "room_update" {
			t.Errorf("Message type = %s, want room_update", decoded.Type)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Room update not broadcast")
	}
}

func TestSendToClient(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	room.SendToClient(client, "test_message", map[string]interface{}{
		"data": "value",
	})

	// Verify client received message
	select {
	case msg := <-client.Send:
		var decoded Message
		if err := json.Unmarshal(msg, &decoded); err != nil {
			t.Fatalf("Failed to decode message: %v", err)
		}
		if decoded.Type != "test_message" {
			t.Errorf("Message type = %s, want test_message", decoded.Type)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Client did not receive message")
	}
}

func BenchmarkHandleAnswer(b *testing.B) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.RoundActive = true
	room.GameState.Scores["alice"] = 0

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 256),
	}

	// Drain send channel
	go func() {
		for range client.Send {
		}
	}()

	payload := map[string]interface{}{
		"answer": "France",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		room.GameState.Answered = make(map[string]bool)
		room.HandleAnswer(client, payload)
	}
}
