package ws

import (
	"briworld/internal/database"
	"briworld/internal/domain"
	redisClient "briworld/internal/redis"
	"context"
	"log"
	"time"
)

// RestartGame resets the game state and starts a new game.
func (r *Room) RestartGame(username string) {
	r.mu.Lock()

	// Only owner can restart
	if r.Owner != username {
		r.mu.Unlock()
		return
	}

	// Reset game state but keep players and settings
	for player := range r.GameState.Scores {
		r.GameState.Scores[player] = 0
	}
	r.GameState.CurrentRound = 0
	r.GameState.Question = nil
	r.GameState.Answered = make(map[string]bool)
	r.GameState.RoundActive = false
	r.GameState.UsedCountries = make(map[string]bool)
	r.GameState.PaintedCountries = make(map[string]string)
	r.GameState.EliminatedPlayers = make(map[string]bool)
	r.GameState.ActivePlayers = 0

	// For single player, start immediately
	if r.GameState.RoomType == "SINGLE" {
		r.GameState.Status = domain.RoomInProgress
		r.GameState.CurrentRound = 1
		r.mu.Unlock()
		r.StartRound()
	} else {
		// For multiplayer, go to waiting room
		r.GameState.Status = domain.RoomWaiting
		r.mu.Unlock()
		r.BroadcastMessage("game_restarted", r.GameState)
		r.BroadcastRoomUpdate()
	}

	log.Printf("Game restarted in room %s by %s", r.ID, username)
}

// CloseRoom closes the room and kicks all players.
func (r *Room) CloseRoom(username string) {
	if r == nil {
		log.Printf("CloseRoom called on nil room")
		return
	}

	r.mu.Lock()
	if r.Owner != username {
		r.mu.Unlock()
		return
	}
	if r.isCleanedUp {
		r.mu.Unlock()
		return
	}

	r.GameState.Status = domain.RoomClosed
	r.GameState.RoundActive = false
	roomID := r.ID
	r.mu.Unlock()

	// Notify all clients
	r.BroadcastMessage("room_closed", map[string]interface{}{
		"message": "Room has been closed by the owner",
	})

	// Wait for broadcast to complete
	time.Sleep(100 * time.Millisecond)

	// Close all client connections
	r.mu.Lock()
	for client := range r.Clients {
		close(client.Send)
		if client.Conn != nil {
			client.Conn.Close()
		}
	}
	r.Clients = make(map[*Client]bool)
	r.isCleanedUp = true
	r.mu.Unlock()

	// Cancel context to stop all goroutines
	r.cancel()

	// Clean up Redis state
	if redisClient.Client != nil {
		ctx := context.Background()
		redisClient.DeleteRoom(ctx, roomID)
	}

	log.Printf("Room %s closed and removed by %s", roomID, username)
}

// AutoCleanup automatically cleans up inactive rooms.
func (r *Room) AutoCleanup() {
	r.mu.Lock()
	if r.isCleanedUp {
		r.mu.Unlock()
		return
	}
	if len(r.Clients) > 0 {
		// Users reconnected - cancel cleanup
		r.inactiveRoundCount = 0
		r.mu.Unlock()
		log.Printf("Room %s cleanup cancelled - users reconnected", r.ID)
		return
	}

	r.GameState.Status = domain.RoomClosed
	r.GameState.RoundActive = false
	roomID := r.ID
	r.isCleanedUp = true
	r.mu.Unlock()

	// Cancel context
	r.cancel()

	// Clean up Redis state
	if redisClient.Client != nil {
		ctx := context.Background()
		redisClient.DeleteRoom(ctx, roomID)
	}

	log.Printf("Room %s auto-cleaned due to inactivity", roomID)
}

// ScheduleCleanup schedules room cleanup after 90 seconds of inactivity.
func (r *Room) ScheduleCleanup() {
	log.Printf("Room %s: Starting 90-second cleanup timer", r.ID)
	time.Sleep(90 * time.Second)
	
	r.mu.Lock()
	if len(r.Clients) > 0 {
		// Users reconnected - cancel cleanup
		r.inactiveRoundCount = 0
		r.mu.Unlock()
		log.Printf("Room %s: Cleanup cancelled - users reconnected", r.ID)
		return
	}
	
	if r.isCleanedUp {
		r.mu.Unlock()
		return
	}
	
	r.GameState.Status = domain.RoomClosed
	r.GameState.RoundActive = false
	roomID := r.ID
	r.isCleanedUp = true
	r.mu.Unlock()
	
	// Cancel context
	r.cancel()
	
	// Clean up Redis state
	if redisClient.Client != nil {
		ctx := context.Background()
		redisClient.DeleteRoom(ctx, roomID)
	}
	
	log.Printf("Room %s: Auto-cleaned after 90s inactivity", roomID)
}

// UpdatePlayerStats updates database statistics for all players after game ends.
func (r *Room) UpdatePlayerStats(scores map[string]int) {
	log.Printf("Updating player stats for room %s with scores: %v", r.ID, scores)

	// Find winner (highest score)
	maxScore := 0
	for _, score := range scores {
		if score > maxScore {
			maxScore = score
		}
	}

	// Update stats for each player
	for username, score := range scores {
		isWinner := score == maxScore && maxScore > 0
		winValue := 0
		if isWinner {
			winValue = 1
		}

		log.Printf("Updating %s: score=%d, isWinner=%v, maxScore=%d",
			username, score, isWinner, maxScore)

		if db := database.GetDB(); db != nil {
			// Calculate rating change based on performance
			ratingService := &domain.RatingService{}
			performanceScore := score
			ratingChange := ratingService.CalculateRatingChange(performanceScore, isWinner)

			if err := db.DB.Exec(`
				UPDATE users 
				SET total_points = total_points + ?,
					total_games = total_games + 1,
					total_wins = total_wins + ?,
					win_streak = CASE WHEN ? THEN win_streak + 1 ELSE 0 END,
					longest_win_streak = CASE 
						WHEN ? AND win_streak + 1 > longest_win_streak 
						THEN win_streak + 1 
						ELSE longest_win_streak 
					END,
					rating = GREATEST(0, rating + ?)
				WHERE username = ?
			`, score, winValue, isWinner, isWinner, ratingChange, username).Error; err != nil {
				log.Printf("Error updating stats for %s: %v", username, err)
			} else {
				log.Printf("Successfully updated stats for %s (rating change: %+d)", username, ratingChange)
			}
		}
	}
}

// handleLastStandingElimination broadcasts eliminations that occurred during the round.
func (r *Room) handleLastStandingElimination() {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Find active players (not eliminated)
	activePlayers := make(map[string]int)
	for username, score := range r.GameState.Scores {
		if !r.GameState.EliminatedPlayers[username] {
			activePlayers[username] = score
		}
	}

	// Need at least 2 players to continue
	if len(activePlayers) <= 1 {
		return
	}

	// Broadcast elimination status
	eliminated := []string{}
	for username := range r.GameState.EliminatedPlayers {
		if r.GameState.EliminatedPlayers[username] {
			eliminated = append(eliminated, username)
		}
	}

	if len(eliminated) > 0 {
		log.Printf("Eliminated players in room %s: %v", r.ID, eliminated)
		r.BroadcastMessage("players_eliminated", map[string]interface{}{
			"eliminated_players": eliminated,
			"reason":             "wrong_answer",
		})
	}
}
