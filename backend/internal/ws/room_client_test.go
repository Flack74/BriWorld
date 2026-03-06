package ws

import (
	"testing"
	"time"
)

func TestAddClient(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Start room event loop to consume broadcasts
	go room.Run()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
		RoomID:   "TEST123",
		GameMode: "FLAG_QUIZ",
		RoomType: "PRIVATE",
	}

	room.AddClient(client)

	// Wait for processing
	time.Sleep(50 * time.Millisecond)

	// Verify client added
	room.mu.RLock()
	_, exists := room.Clients[client]
	owner := room.Owner
	room.mu.RUnlock()

	if !exists {
		t.Error("Client not added to room")
	}
	if owner != "alice" {
		t.Errorf("Owner = %s, want alice", owner)
	}
	if client.Room != room {
		t.Error("Client room reference not set")
	}
}

func TestAddClientScoreInitialization(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()
	go room.Run()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
		RoomID:   "TEST123",
	}

	room.AddClient(client)
	time.Sleep(50 * time.Millisecond)

	room.mu.RLock()
	score, exists := room.GameState.Scores["alice"]
	room.mu.RUnlock()

	if !exists {
		t.Error("Score not initialized for new client")
	}
	if score != 0 {
		t.Errorf("Initial score = %d, want 0", score)
	}
}

func TestAddClientGameModeSet(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()
	go room.Run()

	client := &Client{
		Username:    "alice",
		Send:        make(chan []byte, 10),
		GameMode:    "SILHOUETTE",
		RoomType:    "PUBLIC",
		RoundsCount: 15,
	}

	room.AddClient(client)
	time.Sleep(50 * time.Millisecond)

	room.mu.RLock()
	mode := room.GameState.GameMode
	roomType := room.GameState.RoomType
	rounds := room.GameState.TotalRounds
	room.mu.RUnlock()

	if mode != "SILHOUETTE" {
		t.Errorf("GameMode = %s, want SILHOUETTE", mode)
	}
	if roomType != "PUBLIC" {
		t.Errorf("RoomType = %s, want PUBLIC", roomType)
	}
	if rounds != 15 {
		t.Errorf("TotalRounds = %d, want 15", rounds)
	}
}

func TestAddClientReconnection(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()
	go room.Run()

	client1 := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
		RoomID:   "TEST123",
	}
	room.AddClient(client1)
	time.Sleep(50 * time.Millisecond)

	client2 := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
		RoomID:   "TEST123",
	}
	room.AddClient(client2)
	time.Sleep(50 * time.Millisecond)

	room.mu.RLock()
	count := len(room.Clients)
	_, exists1 := room.Clients[client1]
	_, exists2 := room.Clients[client2]
	room.mu.RUnlock()

	if count != 1 {
		t.Errorf("Client count = %d, want 1", count)
	}
	if exists1 {
		t.Error("Old client still in room")
	}
	if !exists2 {
		t.Error("New client not in room")
	}
}

func TestRemoveClient(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()
	go room.Run()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	room.mu.Lock()
	room.Clients[client] = true
	room.mu.Unlock()

	room.RemoveClient(client)
	time.Sleep(50 * time.Millisecond)

	room.mu.RLock()
	_, exists := room.Clients[client]
	room.mu.RUnlock()

	if exists {
		t.Error("Client not removed from room")
	}
}

func TestRemoveClientOwnerTransfer(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	client1 := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}
	client2 := &Client{
		Username: "bob",
		Send:     make(chan []byte, 10),
	}

	room.mu.Lock()
	room.Owner = "alice"
	room.Clients[client1] = true
	room.Clients[client2] = true
	room.mu.Unlock()

	room.RemoveClient(client1)

	// Verify ownership transferred
	room.mu.RLock()
	owner := room.Owner
	room.mu.RUnlock()

	if owner == "alice" {
		t.Error("Owner not transferred after removal")
	}
	if owner != "bob" {
		t.Errorf("Owner = %s, want bob", owner)
	}
}

func TestRemoveClientInactiveTracking(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	room.mu.Lock()
	room.Clients[client] = true
	room.mu.Unlock()

	room.RemoveClient(client)

	// Verify inactive count incremented
	room.mu.RLock()
	count := room.inactiveRoundCount
	room.mu.RUnlock()

	if count != 1 {
		t.Errorf("inactiveRoundCount = %d, want 1", count)
	}
}

func TestRemoveClientNotInRoom(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	client := &Client{
		Username: "alice",
		Send:     make(chan []byte, 10),
	}

	// Remove client that was never added
	room.RemoveClient(client)

	// Should handle gracefully without panic
}

func TestMultipleClientsManagement(t *testing.T) {
	room := NewRoom("TEST123")
	defer room.cancel()

	clients := []*Client{
		{Username: "alice", Send: make(chan []byte, 10)},
		{Username: "bob", Send: make(chan []byte, 10)},
		{Username: "charlie", Send: make(chan []byte, 10)},
	}

	// Add all clients
	for _, client := range clients {
		room.AddClient(client)
	}

	// Verify all added
	room.mu.RLock()
	count := len(room.Clients)
	room.mu.RUnlock()

	if count != 3 {
		t.Errorf("Client count = %d, want 3", count)
	}

	// Remove one client
	room.RemoveClient(clients[1])

	// Verify count decreased
	room.mu.RLock()
	count = len(room.Clients)
	room.mu.RUnlock()

	if count != 2 {
		t.Errorf("Client count after removal = %d, want 2", count)
	}
}

func BenchmarkAddClient(b *testing.B) {
	room := NewRoom("TEST123")
	defer room.cancel()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		client := &Client{
			Username: "user",
			Send:     make(chan []byte, 10),
		}
		room.AddClient(client)
	}
}

func BenchmarkRemoveClient(b *testing.B) {
	room := NewRoom("TEST123")
	defer room.cancel()

	// Pre-add clients
	clients := make([]*Client, b.N)
	for i := 0; i < b.N; i++ {
		clients[i] = &Client{
			Username: "user",
			Send:     make(chan []byte, 10),
		}
		room.mu.Lock()
		room.Clients[clients[i]] = true
		room.mu.Unlock()
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		room.RemoveClient(clients[i])
	}
}
