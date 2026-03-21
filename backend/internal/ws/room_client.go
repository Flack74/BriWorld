package ws

import (
	"briworld/internal/domain"
	redisClient "briworld/internal/redis"
	"context"
	"log"
)

// AddClient adds a new client to the room or handles reconnection.
func (r *Room) AddClient(client *Client) {
	r.mu.Lock()

	// Check for existing client (reconnection scenario)
	var existingClient *Client
	for c := range r.Clients {
		if c.Username == client.Username {
			existingClient = c
			break
		}
	}

	if existingClient != nil {
		// Reconnection: close old connection and replace
		log.Printf("Player %s reconnecting to room %s", client.Username, r.ID)

		if existingClient.ReconnectCancelFunc != nil {
			existingClient.ReconnectCancelFunc()
		}

		close(existingClient.Send)
		if existingClient.Conn != nil {
			existingClient.Conn.Close()
		}

		delete(r.Clients, existingClient)
	}

	// Check if room is full (6 player limit) - count only active players, not spectators
	playerCount := 0
	for c := range r.Clients {
		if !c.IsSpectator {
			playerCount++
		}
	}

	if playerCount >= 6 {
		// Room is full - add as spectator
		client.IsSpectator = true
		log.Printf("Player %s joined room %s as SPECTATOR (room full: %d/6 players)",
			client.Username, r.ID, playerCount)
	} else {
		client.IsSpectator = false
	}

	// Add new client
	r.Clients[client] = true
	client.Room = r

	// Set owner if first player (MUST be before auto-start)
	if r.Owner == "" {
		r.Owner = client.Username
		log.Printf("Player %s is now owner of room %s", client.Username, r.ID)
	}

	// Initialize player score only for non-spectators
	if !client.IsSpectator {
		if _, exists := r.GameState.Scores[client.Username]; !exists {
			r.GameState.Scores[client.Username] = 0
		}
	}

	// Set game mode and room type from first client
	if r.GameState.GameMode == "" {
		r.GameState.GameMode = client.GameMode
		r.GameState.RoomType = client.RoomType
		r.GameState.TotalRounds = client.RoundsCount
		if client.TimeoutSeconds > 0 {
			r.GameState.TimeRemaining = client.TimeoutSeconds
		}
	} else {
		// Joining existing room - inherit settings
		client.RoundsCount = r.GameState.TotalRounds
		client.TimeoutSeconds = r.GameState.TimeRemaining
	}

	// Build room_joined payload while still holding the lock
	players := make([]string, 0, len(r.Clients))
	playerAvatars := make(map[string]string)
	playerBanners := make(map[string]string)
	for c := range r.Clients {
		if !c.IsSpectator {
			players = append(players, c.Username)
			if c.AvatarURL != "" {
				playerAvatars[c.Username] = c.AvatarURL
			}
			if c.BannerURL != "" {
				playerBanners[c.Username] = c.BannerURL
			}
		}
	}

	joinedPayload := map[string]interface{}{
		"players":           players,
		"current_count":     len(players),
		"status":            string(r.GameState.Status),
		"current_round":     r.GameState.CurrentRound,
		"total_rounds":      r.GameState.TotalRounds,
		"question":          r.GameState.Question,
		"scores":            cloneStringIntMap(r.GameState.Scores),
		"time_remaining":    r.GameState.TimeRemaining,
		"owner":             r.Owner,
		"game_mode":         r.GameState.GameMode,
		"room_type":         r.GameState.RoomType,
		"map_mode":          r.GameState.MapMode,
		"painted_countries": cloneStringStringMap(r.GameState.PaintedCountries),
		"player_colors":     cloneStringStringMap(r.GameState.PlayerColors),
		"player_avatars":    playerAvatars,
		"player_banners":    playerBanners,
		"is_owner":          r.Owner == client.Username,
	}

	shouldAutoStart := r.GameState.RoomType == "SINGLE" && r.GameState.Status == domain.RoomWaiting && r.Owner == client.Username
	roomID := r.ID

	log.Printf("Player %s joined room %s (total: %d players, %d spectators)",
		client.Username, r.ID, len(players), len(r.Clients)-len(players))

	// Release lock BEFORE calling BroadcastRoomUpdate (which acquires RLock)
	r.mu.Unlock()

	// Sync to Redis
	if redisClient.Client != nil {
		ctx := context.Background()
		redisClient.AddPlayer(ctx, roomID, client.Username)
		redisClient.UpdateRoomActivity(ctx, roomID)
	}

	// Send room_joined to the connecting client
	r.SendToClient(client, "room_joined", joinedPayload)
	r.SendToClient(client, "state_snapshot", r.BuildStatePayload())

	// For SINGLE player rooms, send game_started immediately
	if shouldAutoStart {
		r.mu.Lock()
		r.GameState.Status = "in_progress"
		r.GameState.CurrentRound = 0
		r.mu.Unlock()
		go r.BroadcastMessage("game_started", r.GameState)
		go r.StartRound()
	}

	// Broadcast room update to all clients
	r.BroadcastRoomUpdate()
	r.BroadcastStateSnapshot()
}

// RemoveClient removes a client from the room.
func (r *Room) RemoveClient(client *Client) {
	r.mu.Lock()

	if _, exists := r.Clients[client]; !exists {
		r.mu.Unlock()
		return
	}

	delete(r.Clients, client)
	close(client.Send)

	log.Printf("Player %s left room %s (remaining: %d players)",
		client.Username, r.ID, len(r.Clients))

	// Sync to Redis
	if redisClient.Client != nil {
		ctx := context.Background()
		redisClient.RemovePlayer(ctx, r.ID, client.Username)
		redisClient.RemovePlayerColor(ctx, r.ID, client.Username)
	}

	if client.PermanentLeave {
		delete(r.GameState.Scores, client.Username)
		delete(r.GameState.Answered, client.Username)
		delete(r.GameState.PlayerColors, client.Username)
		delete(r.GameState.EliminatedPlayers, client.Username)
		delete(r.GameState.Teams, client.Username)
		for countryCode, paintedBy := range r.GameState.PaintedCountries {
			if paintedBy == client.Username {
				delete(r.GameState.PaintedCountries, countryCode)
			}
		}
		GetStateManager().RemoveSessionFromRoom(r.ID, client.SessionID, client.Username)
	}

	// Handle owner transfer - transfer to next non-spectator player
	if r.Owner == client.Username && len(r.Clients) > 0 {
		for c := range r.Clients {
			if !c.IsSpectator {
				r.Owner = c.Username
				log.Printf("Ownership transferred to %s in room %s", r.Owner, r.ID)
				break
			}
		}
		// If no active players, transfer to first spectator
		if r.Owner == client.Username {
			for c := range r.Clients {
				r.Owner = c.Username
				log.Printf("Ownership transferred to spectator %s in room %s", r.Owner, r.ID)
				break
			}
		}
	}

	// Promote first spectator to player if a player left
	if !client.IsSpectator {
		for c := range r.Clients {
			if c.IsSpectator {
				// Send promotion offer to spectator
				r.SendToClient(c, "promotion_offer", map[string]interface{}{
					"message": "A player slot is available. Join as a player?",
				})
				log.Printf("Promotion offer sent to spectator %s in room %s", c.Username, r.ID)
				break
			}
		}
	}

	// Check if room is empty
	isEmpty := len(r.Clients) == 0
	shouldCleanup := false
	if isEmpty {
		if client.PermanentLeave {
			r.GameState.Status = domain.RoomClosed
			r.GameState.RoundActive = false
			r.isCleanedUp = true
			log.Printf("Room %s is empty after explicit leave, cleaning up immediately", r.ID)
		} else {
			// Start 90-second inactivity timer
			r.inactiveRoundCount++
			log.Printf("Room %s is empty, starting 90s cleanup timer", r.ID)
		}
		shouldCleanup = true
	} else {
		r.inactiveRoundCount = 0
	}

	immediateCleanup := isEmpty && client.PermanentLeave
	roomID := r.ID

	// Release lock before external calls
	r.mu.Unlock()

	if shouldCleanup {
		if immediateCleanup {
			r.cancel()
			cleanupRoomResources(roomID)
		} else {
			go r.ScheduleCleanup()
		}
	} else if !isEmpty {
		r.BroadcastRoomUpdate()
	}
}
