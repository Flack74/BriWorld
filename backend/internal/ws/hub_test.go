package ws

import (
	"briworld/internal/domain"
	"testing"
)

// TestNewHub tests hub initialization
func TestNewHub(t *testing.T) {
	hub := NewHub()

	// Verify maps are initialized
	if hub.rooms == nil {
		t.Error("rooms map is nil")
	}
	if len(hub.rooms) != 0 {
		t.Errorf("rooms map should be empty, got %d", len(hub.rooms))
	}

	// Verify channels are initialized
	if hub.register == nil {
		t.Error("register channel is nil")
	}
	if hub.unregister == nil {
		t.Error("unregister channel is nil")
	}
}

// TestHubGetOrCreateRoom tests room creation and retrieval
func TestHubGetOrCreateRoom(t *testing.T) {
	hub := NewHub()

	roomCode := "TEST123"

	// First call should create room
	room1 := hub.GetOrCreateRoom(roomCode)
	if room1 == nil {
		t.Fatal("GetOrCreateRoom returned nil")
	}
	if room1.ID != roomCode {
		t.Errorf("Room ID = %s, want %s", room1.ID, roomCode)
	}

	// Verify room is stored in hub
	hub.mu.RLock()
	storedRoom := hub.rooms[roomCode]
	hub.mu.RUnlock()

	if storedRoom == nil {
		t.Error("Room not stored in hub")
	}
	if storedRoom != room1 {
		t.Error("Stored room is different from returned room")
	}

	// Second call should return existing room
	room2 := hub.GetOrCreateRoom(roomCode)
	if room2 != room1 {
		t.Error("GetOrCreateRoom returned different room for same code")
	}

	// Clean up
	room1.cancel()
}

// TestHubGetRoom tests room retrieval
func TestHubGetRoom(t *testing.T) {
	hub := NewHub()

	roomCode := "TEST123"

	// Initially should return nil
	room := hub.GetRoom(roomCode)
	if room != nil {
		t.Error("GetRoom should return nil for non-existent room")
	}

	// Create room
	createdRoom := hub.GetOrCreateRoom(roomCode)
	defer createdRoom.cancel()

	// Now should return the room
	room = hub.GetRoom(roomCode)
	if room == nil {
		t.Error("GetRoom returned nil for existing room")
	}
	if room != createdRoom {
		t.Error("GetRoom returned different room")
	}
}

// TestHubRemoveRoom tests room removal
func TestHubRemoveRoom(t *testing.T) {
	hub := NewHub()

	roomCode := "TEST123"

	// Create room
	room := hub.GetOrCreateRoom(roomCode)
	defer room.cancel()

	// Verify room exists
	if hub.GetRoom(roomCode) == nil {
		t.Error("Room should exist before removal")
	}

	// Remove room
	hub.RemoveRoom(roomCode)

	// Verify room is removed
	if hub.GetRoom(roomCode) != nil {
		t.Error("Room should be removed")
	}
}

// TestHubMultipleRooms tests managing multiple rooms
func TestHubMultipleRooms(t *testing.T) {
	hub := NewHub()

	roomCodes := []string{"ROOM1", "ROOM2", "ROOM3"}
	rooms := make([]*Room, len(roomCodes))

	// Create multiple rooms
	for i, code := range roomCodes {
		rooms[i] = hub.GetOrCreateRoom(code)
		if rooms[i] == nil {
			t.Fatalf("Failed to create room %s", code)
		}
		defer rooms[i].cancel()
	}

	// Verify all rooms exist
	hub.mu.RLock()
	if len(hub.rooms) != 3 {
		t.Errorf("Hub has %d rooms, want 3", len(hub.rooms))
	}
	hub.mu.RUnlock()

	// Verify each room is retrievable
	for i, code := range roomCodes {
		room := hub.GetRoom(code)
		if room != rooms[i] {
			t.Errorf("Room %s not retrievable", code)
		}
	}
}

// TestHubClosedRoomHandling tests that closed rooms are not returned
func TestHubClosedRoomHandling(t *testing.T) {
	hub := NewHub()

	roomCode := "TEST123"
	room := hub.GetOrCreateRoom(roomCode)
	defer room.cancel()

	// Mark room as closed
	room.mu.Lock()
	room.GameState.Status = domain.RoomClosed
	room.mu.Unlock()

	// Try to get the room again - should return nil
	retrievedRoom := hub.GetOrCreateRoom(roomCode)
	if retrievedRoom != nil {
		t.Error("GetOrCreateRoom should return nil for closed room")
	}
}

// TestHubCompletedEmptyRoomReuse tests room reuse after completion
func TestHubCompletedEmptyRoomReuse(t *testing.T) {
	hub := NewHub()

	roomCode := "TEST123"
	room1 := hub.GetOrCreateRoom(roomCode)

	// Mark room as completed and empty
	room1.mu.Lock()
	room1.GameState.Status = domain.RoomCompleted
	// Clients map is already empty
	room1.mu.Unlock()

	// Get room again - should create new room
	room2 := hub.GetOrCreateRoom(roomCode)
	if room2 == nil {
		t.Fatal("GetOrCreateRoom returned nil")
	}

	// Should be a different room instance
	if room1 == room2 {
		t.Error("Should have created new room for completed empty room")
	}

	// New room should be in waiting status
	room2.mu.RLock()
	status := room2.GameState.Status
	room2.mu.RUnlock()

	if status != domain.RoomWaiting {
		t.Errorf("New room status = %v, want %v", status, domain.RoomWaiting)
	}

	// Clean up
	room1.cancel()
	room2.cancel()
}

// TestHubGetPublicRooms tests public room listing
func TestHubGetPublicRooms(t *testing.T) {
	hub := NewHub()

	// Create public room
	publicRoom := hub.GetOrCreateRoom("PUBLIC1")
	defer publicRoom.cancel()

	publicRoom.mu.Lock()
	publicRoom.GameState.RoomType = "PUBLIC"
	publicRoom.GameState.GameMode = "FLAG_QUIZ"
	publicRoom.GameState.Status = domain.RoomWaiting
	publicRoom.Owner = "alice"
	// Add a mock client
	mockClient := &Client{Username: "alice", Send: make(chan []byte, 10)}
	publicRoom.Clients[mockClient] = true
	publicRoom.mu.Unlock()

	// Create private room
	privateRoom := hub.GetOrCreateRoom("PRIVATE1")
	defer privateRoom.cancel()

	privateRoom.mu.Lock()
	privateRoom.GameState.RoomType = "PRIVATE"
	privateRoom.GameState.GameMode = "FLAG_QUIZ"
	privateRoom.GameState.Status = domain.RoomWaiting
	privateRoom.mu.Unlock()

	// Get public rooms
	publicRooms := hub.GetPublicRooms("")

	// Should only return public room
	if len(publicRooms) != 1 {
		t.Errorf("Expected 1 public room, got %d", len(publicRooms))
	}

	if len(publicRooms) > 0 {
		room := publicRooms[0]
		if room["id"] != "PUBLIC1" {
			t.Errorf("Room ID = %v, want PUBLIC1", room["id"])
		}
		if room["mode"] != "FLAG_QUIZ" {
			t.Errorf("Room mode = %v, want FLAG_QUIZ", room["mode"])
		}
		if room["host"] != "alice" {
			t.Errorf("Room host = %v, want alice", room["host"])
		}
	}
}

// TestHubGetPublicRoomsByMode tests filtering public rooms by game mode
func TestHubGetPublicRoomsByMode(t *testing.T) {
	hub := NewHub()

	// Create rooms with different modes
	flagRoom := hub.GetOrCreateRoom("FLAG1")
	defer flagRoom.cancel()
	flagRoom.mu.Lock()
	flagRoom.GameState.RoomType = "PUBLIC"
	flagRoom.GameState.GameMode = "FLAG_QUIZ"
	flagRoom.GameState.Status = domain.RoomWaiting
	flagRoom.Clients[&Client{Username: "user1", Send: make(chan []byte, 10)}] = true
	flagRoom.mu.Unlock()

	silhouetteRoom := hub.GetOrCreateRoom("SILHOUETTE1")
	defer silhouetteRoom.cancel()
	silhouetteRoom.mu.Lock()
	silhouetteRoom.GameState.RoomType = "PUBLIC"
	silhouetteRoom.GameState.GameMode = "SILHOUETTE"
	silhouetteRoom.GameState.Status = domain.RoomWaiting
	silhouetteRoom.Clients[&Client{Username: "user2", Send: make(chan []byte, 10)}] = true
	silhouetteRoom.mu.Unlock()

	// Get only FLAG_QUIZ rooms
	flagRooms := hub.GetPublicRooms("FLAG_QUIZ")
	if len(flagRooms) != 1 {
		t.Errorf("Expected 1 FLAG_QUIZ room, got %d", len(flagRooms))
	}
	if len(flagRooms) > 0 && flagRooms[0]["mode"] != "FLAG_QUIZ" {
		t.Error("Filtered room has wrong mode")
	}

	// Get only SILHOUETTE rooms
	silhouetteRooms := hub.GetPublicRooms("SILHOUETTE")
	if len(silhouetteRooms) != 1 {
		t.Errorf("Expected 1 SILHOUETTE room, got %d", len(silhouetteRooms))
	}

	// Get all rooms (empty filter)
	allRooms := hub.GetPublicRooms("")
	if len(allRooms) != 2 {
		t.Errorf("Expected 2 total rooms, got %d", len(allRooms))
	}
}

// TestHubPublicRoomFiltering tests various filtering conditions
func TestHubPublicRoomFiltering(t *testing.T) {
	hub := NewHub()

	// Room with no players - should not be listed
	emptyRoom := hub.GetOrCreateRoom("EMPTY")
	defer emptyRoom.cancel()
	emptyRoom.mu.Lock()
	emptyRoom.GameState.RoomType = "PUBLIC"
	emptyRoom.GameState.Status = domain.RoomWaiting
	emptyRoom.mu.Unlock()

	// Full room - should not be listed
	fullRoom := hub.GetOrCreateRoom("FULL")
	defer fullRoom.cancel()
	fullRoom.mu.Lock()
	fullRoom.GameState.RoomType = "PUBLIC"
	fullRoom.GameState.Status = domain.RoomWaiting
	fullRoom.GameState.GameMode = "FLAG_QUIZ"
	// Add 6 clients (max for non-team modes)
	for i := 0; i < 6; i++ {
		fullRoom.Clients[&Client{Send: make(chan []byte, 10)}] = true
	}
	fullRoom.mu.Unlock()

	// Cleaned up room - should not be listed
	cleanedRoom := hub.GetOrCreateRoom("CLEANED")
	defer cleanedRoom.cancel()
	cleanedRoom.mu.Lock()
	cleanedRoom.GameState.RoomType = "PUBLIC"
	cleanedRoom.GameState.Status = domain.RoomWaiting
	cleanedRoom.isCleanedUp = true
	cleanedRoom.Clients[&Client{Send: make(chan []byte, 10)}] = true
	cleanedRoom.mu.Unlock()

	// Valid room - should be listed
	validRoom := hub.GetOrCreateRoom("VALID")
	defer validRoom.cancel()
	validRoom.mu.Lock()
	validRoom.GameState.RoomType = "PUBLIC"
	validRoom.GameState.Status = domain.RoomWaiting
	validRoom.GameState.GameMode = "FLAG_QUIZ"
	validRoom.Clients[&Client{Send: make(chan []byte, 10)}] = true
	validRoom.mu.Unlock()

	// Get public rooms
	publicRooms := hub.GetPublicRooms("")

	// Should only return valid room
	if len(publicRooms) != 1 {
		t.Errorf("Expected 1 valid room, got %d", len(publicRooms))
	}
	if len(publicRooms) > 0 && publicRooms[0]["id"] != "VALID" {
		t.Errorf("Wrong room returned: %v", publicRooms[0]["id"])
	}
}

// TestHubTeamBattleMaxPlayers tests that TEAM_BATTLE mode allows more players
func TestHubTeamBattleMaxPlayers(t *testing.T) {
	hub := NewHub()

	room := hub.GetOrCreateRoom("TEAM1")
	defer room.cancel()

	room.mu.Lock()
	room.GameState.RoomType = "PUBLIC"
	room.GameState.GameMode = "TEAM_BATTLE"
	room.GameState.Status = domain.RoomWaiting
	// Add 8 clients (should still be listed as max is 10 for team battle)
	for i := 0; i < 8; i++ {
		room.Clients[&Client{Send: make(chan []byte, 10)}] = true
	}
	room.mu.Unlock()

	publicRooms := hub.GetPublicRooms("")

	if len(publicRooms) != 1 {
		t.Errorf("TEAM_BATTLE room with 8 players should be listed, got %d rooms", len(publicRooms))
	}

	if len(publicRooms) > 0 {
		if publicRooms[0]["maxPlayers"] != 10 {
			t.Errorf("TEAM_BATTLE maxPlayers = %v, want 10", publicRooms[0]["maxPlayers"])
		}
	}
}

// TestHubConcurrentAccess tests thread-safe hub operations
func TestHubConcurrentAccess(t *testing.T) {
	hub := NewHub()

	done := make(chan bool)
	iterations := 50

	// Concurrent room creation
	go func() {
		for i := 0; i < iterations; i++ {
			room := hub.GetOrCreateRoom("CONCURRENT")
			if room != nil {
				room.cancel()
			}
		}
		done <- true
	}()

	// Concurrent room retrieval
	go func() {
		for i := 0; i < iterations; i++ {
			hub.GetRoom("CONCURRENT")
		}
		done <- true
	}()

	// Concurrent public room listing
	go func() {
		for i := 0; i < iterations; i++ {
			hub.GetPublicRooms("")
		}
		done <- true
	}()

	// Wait for all goroutines
	<-done
	<-done
	<-done

	// If we get here without deadlock or race, test passes
}

// BenchmarkHubGetOrCreateRoom benchmarks room creation/retrieval
func BenchmarkHubGetOrCreateRoom(b *testing.B) {
	hub := NewHub()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		room := hub.GetOrCreateRoom("BENCH")
		if i == 0 {
			defer room.cancel()
		}
	}
}

// BenchmarkHubGetPublicRooms benchmarks public room listing
func BenchmarkHubGetPublicRooms(b *testing.B) {
	hub := NewHub()

	// Create some rooms
	for i := 0; i < 10; i++ {
		room := hub.GetOrCreateRoom("ROOM" + string(rune(i)))
		defer room.cancel()
		room.mu.Lock()
		room.GameState.RoomType = "PUBLIC"
		room.GameState.Status = domain.RoomWaiting
		room.Clients[&Client{Send: make(chan []byte, 10)}] = true
		room.mu.Unlock()
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		hub.GetPublicRooms("")
	}
}
