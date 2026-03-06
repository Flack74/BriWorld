package ws

import (
	"briworld/internal/domain"
	"testing"
	"time"
)

func TestStartGame(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.Owner = "alice"
	room.GameState.Status = domain.RoomWaiting
	room.GameState.GameMode = "FLAG_QUIZ"

	// Start game (will fail to start round due to no countries, but status should change)
	room.StartGame("alice")

	// Wait briefly for async operations
	time.Sleep(50 * time.Millisecond)

	// Verify status changed to in_progress or completed (if round failed)
	room.mu.RLock()
	status := room.GameState.Status
	room.mu.RUnlock()

	if status == domain.RoomWaiting {
		t.Error("Status should have changed from waiting")
	}
}

func TestStartGameNonOwner(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.Owner = "alice"
	room.GameState.Status = domain.RoomWaiting

	room.StartGame("bob")

	// Status should not change
	room.mu.RLock()
	status := room.GameState.Status
	room.mu.RUnlock()

	if status != domain.RoomWaiting {
		t.Errorf("Non-owner changed game status to %v", status)
	}
}

func TestStartGameAlreadyStarted(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.Owner = "alice"
	room.GameState.Status = domain.RoomInProgress
	room.GameState.CurrentRound = 5

	room.StartGame("alice")

	// Round should not reset
	room.mu.RLock()
	round := room.GameState.CurrentRound
	room.mu.RUnlock()

	if round != 5 {
		t.Errorf("Round changed to %d when game already started", round)
	}
}

func TestEndRound(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.RoundActive = true
	room.GameState.CurrentRound = 1

	room.EndRound()

	// Verify round ended
	room.mu.RLock()
	active := room.GameState.RoundActive
	room.mu.RUnlock()

	if active {
		t.Error("Round still active after EndRound")
	}
}

func TestEndRoundNotActive(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.GameState.RoundActive = false
	room.GameState.CurrentRound = 1

	room.EndRound()

	// Should handle gracefully
	room.mu.RLock()
	round := room.GameState.CurrentRound
	room.mu.RUnlock()

	if round != 1 {
		t.Error("Round changed when not active")
	}
}

func TestRestartGame(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.Owner = "alice"
	room.GameState.Scores["alice"] = 100
	room.GameState.Scores["bob"] = 75
	room.GameState.CurrentRound = 10
	room.GameState.RoomType = "PRIVATE"

	room.RestartGame("alice")

	// Wait for restart to process
	time.Sleep(50 * time.Millisecond)

	// Verify scores reset
	room.mu.RLock()
	aliceScore := room.GameState.Scores["alice"]
	bobScore := room.GameState.Scores["bob"]
	round := room.GameState.CurrentRound
	room.mu.RUnlock()

	if aliceScore != 0 {
		t.Errorf("alice score = %d, want 0", aliceScore)
	}
	if bobScore != 0 {
		t.Errorf("bob score = %d, want 0", bobScore)
	}
	if round != 0 {
		t.Errorf("CurrentRound = %d, want 0", round)
	}
}

func TestRestartGameNonOwner(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.Owner = "alice"
	room.GameState.Scores["alice"] = 100
	room.GameState.CurrentRound = 10

	room.RestartGame("bob")

	// Scores should not reset
	room.mu.RLock()
	score := room.GameState.Scores["alice"]
	round := room.GameState.CurrentRound
	room.mu.RUnlock()

	if score != 100 {
		t.Error("Non-owner was able to restart game")
	}
	if round != 10 {
		t.Error("Non-owner changed game state")
	}
}

func TestCloseRoom(t *testing.T) {
	room := NewRoom("TEST123")

	room.Owner = "alice"
	room.GameState.Status = domain.RoomInProgress

	// Add client
	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}
	room.mu.Lock()
	room.Clients[client] = true
	room.mu.Unlock()

	room.CloseRoom("alice")

	// Wait for close to process
	time.Sleep(150 * time.Millisecond)

	// Verify room closed
	room.mu.RLock()
	status := room.GameState.Status
	cleanedUp := room.isCleanedUp
	clientCount := len(room.Clients)
	room.mu.RUnlock()

	if status != domain.RoomClosed {
		t.Errorf("Status = %v, want %v", status, domain.RoomClosed)
	}
	if !cleanedUp {
		t.Error("Room not marked as cleaned up")
	}
	if clientCount != 0 {
		t.Errorf("Clients not removed, count = %d", clientCount)
	}
}

func TestCloseRoomNonOwner(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	room.Owner = "alice"
	room.GameState.Status = domain.RoomInProgress

	room.CloseRoom("bob")

	// Status should not change
	room.mu.RLock()
	status := room.GameState.Status
	room.mu.RUnlock()

	if status != domain.RoomInProgress {
		t.Error("Non-owner was able to close room")
	}
}

func TestAutoCleanup(t *testing.T) {
	room := NewRoom("TEST123")

	room.GameState.Status = domain.RoomInProgress

	room.AutoCleanup()

	// Wait for cleanup
	time.Sleep(50 * time.Millisecond)

	// Verify cleanup
	room.mu.RLock()
	status := room.GameState.Status
	cleanedUp := room.isCleanedUp
	room.mu.RUnlock()

	if status != domain.RoomClosed {
		t.Errorf("Status = %v, want %v", status, domain.RoomClosed)
	}
	if !cleanedUp {
		t.Error("Room not marked as cleaned up")
	}
}

func TestAutoCleanupWithPlayers(t *testing.T) {
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

	room.AutoCleanup()

	// Wait
	time.Sleep(50 * time.Millisecond)

	// Should not cleanup with players
	room.mu.RLock()
	cleanedUp := room.isCleanedUp
	room.mu.RUnlock()

	if cleanedUp {
		t.Error("Room cleaned up despite having players")
	}
}
