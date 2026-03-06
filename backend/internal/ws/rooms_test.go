package ws

import (
	"briworld/internal/domain"
	"testing"
	"time"
)

// TestNewRoom tests room initialization
func TestNewRoom(t *testing.T) {
	roomID := "TEST123"
	room := NewRoom(roomID)

	// Verify room ID
	if room.ID != roomID {
		t.Errorf("Room ID = %s, want %s", room.ID, roomID)
	}

	// Verify channels are initialized
	if room.Broadcast == nil {
		t.Error("Broadcast channel is nil")
	}
	if room.Register == nil {
		t.Error("Register channel is nil")
	}
	if room.Unregister == nil {
		t.Error("Unregister channel is nil")
	}

	// Verify maps are initialized
	if room.Clients == nil {
		t.Error("Clients map is nil")
	}
	if len(room.Clients) != 0 {
		t.Errorf("Clients map should be empty, got %d", len(room.Clients))
	}

	// Verify game state is initialized
	if room.GameState == nil {
		t.Error("GameState is nil")
	}
	if room.GameState.Status != domain.RoomWaiting {
		t.Errorf("Initial status = %v, want %v", room.GameState.Status, domain.RoomWaiting)
	}

	// Verify context is set up
	if room.ctx == nil {
		t.Error("Context is nil")
	}
	if room.cancel == nil {
		t.Error("Cancel function is nil")
	}

	// Verify initial state
	if room.Owner != "" {
		t.Errorf("Owner should be empty, got %s", room.Owner)
	}
	if room.isCleanedUp {
		t.Error("isCleanedUp should be false")
	}
	if room.inactiveRoundCount != 0 {
		t.Errorf("inactiveRoundCount = %d, want 0", room.inactiveRoundCount)
	}

	// Clean up
	room.cancel()
}

// TestRoomChannelCapacity tests channel buffer sizes
func TestRoomChannelCapacity(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Verify channel capacities
	if cap(room.Broadcast) != 256 {
		t.Errorf("Broadcast channel capacity = %d, want 256", cap(room.Broadcast))
	}
	if cap(room.Register) != 16 {
		t.Errorf("Register channel capacity = %d, want 16", cap(room.Register))
	}
	if cap(room.Unregister) != 16 {
		t.Errorf("Unregister channel capacity = %d, want 16", cap(room.Unregister))
	}
}

// TestRoomContextCancellation tests that context cancellation stops the room
func TestRoomContextCancellation(t *testing.T) {
	room := NewRoom("TEST123")

	// Start room in goroutine
	done := make(chan bool)
	go func() {
		room.Run()
		done <- true
	}()

	// Cancel context
	room.cancel()

	// Wait for room to stop (with timeout)
	select {
	case <-done:
		// Success - room stopped
	case <-time.After(1 * time.Second):
		t.Error("Room did not stop after context cancellation")
	}
}

// TestRoomBroadcastToClients tests message broadcasting
func TestRoomBroadcastToClients(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Create mock clients
	client1 := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}
	client2 := &Client{
		Username: "bob",
		Send:     make(chan []byte, 10),
	}

	// Add clients to room
	room.mu.Lock()
	room.Clients[client1] = true
	room.Clients[client2] = true
	room.mu.Unlock()

	// Broadcast message
	testMessage := []byte("test message")
	room.broadcastToClients(testMessage)

	// Verify both clients received the message
	select {
	case msg := <-client1.Send:
		if string(msg) != string(testMessage) {
			t.Errorf("client1 received %s, want %s", msg, testMessage)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("client1 did not receive message")
	}

	select {
	case msg := <-client2.Send:
		if string(msg) != string(testMessage) {
			t.Errorf("client2 received %s, want %s", msg, testMessage)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("client2 did not receive message")
	}
}

// TestRoomBroadcastWithFullBuffer tests broadcast behavior when client buffer is full
func TestRoomBroadcastWithFullBuffer(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Create client with small buffer
	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 1),
	}

	room.mu.Lock()
	room.Clients[client] = true
	room.mu.Unlock()

	// Fill the buffer
	client.Send <- []byte("message1")

	// Try to broadcast - should not block
	done := make(chan bool)
	go func() {
		room.broadcastToClients([]byte("message2"))
		done <- true
	}()

	// Verify broadcast completes quickly (doesn't block)
	select {
	case <-done:
		// Success - broadcast didn't block
	case <-time.After(100 * time.Millisecond):
		t.Error("Broadcast blocked on full client buffer")
	}
}

// TestRoomOwnerAssignment tests owner assignment logic
func TestRoomOwnerAssignment(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Initially no owner
	if room.Owner != "" {
		t.Errorf("Initial owner should be empty, got %s", room.Owner)
	}

	// First client becomes owner
	client1 := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
		RoomID:   "TEST123",
	}

	room.mu.Lock()
	if room.Owner == "" {
		room.Owner = client1.Username
	}
	room.Clients[client1] = true
	room.mu.Unlock()

	if room.Owner != "alice" {
		t.Errorf("Owner = %s, want alice", room.Owner)
	}

	// Second client doesn't change owner
	client2 := &Client{
		Username: "bob",
		Send:     make(chan []byte, 10),
		RoomID:   "TEST123",
	}

	room.mu.Lock()
	room.Clients[client2] = true
	room.mu.Unlock()

	if room.Owner != "alice" {
		t.Errorf("Owner changed to %s, should remain alice", room.Owner)
	}
}

// TestRoomConcurrentAccess tests thread-safe access to room state
func TestRoomConcurrentAccess(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Simulate concurrent reads and writes
	done := make(chan bool)
	iterations := 100

	// Writer goroutine
	go func() {
		for i := 0; i < iterations; i++ {
			room.mu.Lock()
			room.GameState.CurrentRound = i
			room.mu.Unlock()
		}
		done <- true
	}()

	// Reader goroutine
	go func() {
		for i := 0; i < iterations; i++ {
			room.mu.RLock()
			_ = room.GameState.CurrentRound
			room.mu.RUnlock()
		}
		done <- true
	}()

	// Wait for both goroutines
	<-done
	<-done

	// If we get here without deadlock or race, test passes
}

// TestRoomGameStateInitialization tests that game state is properly initialized
func TestRoomGameStateInitialization(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Verify game state structure
	if room.GameState.Scores == nil {
		t.Error("Scores map not initialized")
	}
	if room.GameState.Answered == nil {
		t.Error("Answered map not initialized")
	}
	if room.GameState.UsedCountries == nil {
		t.Error("UsedCountries map not initialized")
	}
	if room.GameState.PlayerColors == nil {
		t.Error("PlayerColors map not initialized")
	}
	if room.GameState.Teams == nil {
		t.Error("Teams map not initialized")
	}
	if room.GameState.EliminatedPlayers == nil {
		t.Error("EliminatedPlayers map not initialized")
	}
}

// TestRoomCleanupState tests the cleanup state tracking
func TestRoomCleanupState(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Initially not cleaned up
	if room.isCleanedUp {
		t.Error("Room should not be cleaned up initially")
	}

	// Mark as cleaned up
	room.mu.Lock()
	room.isCleanedUp = true
	room.mu.Unlock()

	// Verify state
	room.mu.RLock()
	if !room.isCleanedUp {
		t.Error("Room should be marked as cleaned up")
	}
	room.mu.RUnlock()
}

// TestRoomInactiveRoundTracking tests inactive round counting
func TestRoomInactiveRoundTracking(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Initially zero
	if room.inactiveRoundCount != 0 {
		t.Errorf("Initial inactive count = %d, want 0", room.inactiveRoundCount)
	}

	// Increment inactive rounds
	room.mu.Lock()
	room.inactiveRoundCount++
	room.inactiveRoundCount++
	room.inactiveRoundCount++
	count := room.inactiveRoundCount
	room.mu.Unlock()

	if count != 3 {
		t.Errorf("Inactive count = %d, want 3", count)
	}

	// Reset on activity
	room.mu.Lock()
	room.inactiveRoundCount = 0
	room.mu.Unlock()

	room.mu.RLock()
	if room.inactiveRoundCount != 0 {
		t.Errorf("Inactive count after reset = %d, want 0", room.inactiveRoundCount)
	}
	room.mu.RUnlock()
}

// BenchmarkNewRoom benchmarks room creation
func BenchmarkNewRoom(b *testing.B) {
	for i := 0; i < b.N; i++ {
		room := NewRoom("TEST123")
		room.cancel()
	}
}

// BenchmarkRoomBroadcast benchmarks message broadcasting
func BenchmarkRoomBroadcast(b *testing.B) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Add some clients
	for i := 0; i < 10; i++ {
		client := &Client{
			Send: make(chan []byte, 256),
		}
		room.mu.Lock()
		room.Clients[client] = true
		room.mu.Unlock()

		// Drain messages in background
		go func(c *Client) {
			for range c.Send {
			}
		}(client)
	}

	message := []byte("test message")
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		room.broadcastToClients(message)
	}
}
