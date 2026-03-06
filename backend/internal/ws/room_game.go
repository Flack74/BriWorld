package ws

import (
	"briworld/internal/domain"
	"briworld/internal/game"
	redisClient "briworld/internal/redis"
	"context"
	"log"
	"time"
)

// StartGame initiates the game (only owner can start).
func (r *Room) StartGame(username string) {
	r.mu.Lock()

	if r.Owner != username {
		r.mu.Unlock()
		return
	}

	if r.GameState.Status != domain.RoomWaiting {
		r.mu.Unlock()
		return
	}

	r.GameState.Status = domain.RoomInProgress
	r.GameState.CurrentRound = 0

	// Assign teams for TEAM_BATTLE mode
	if r.GameState.GameMode == "TEAM_BATTLE" {
		r.assignTeams()
	}

	r.mu.Unlock()

	// Send game_started immediately in background
	go r.BroadcastMessage("game_started", r.GameState)
	// Start first round in background
	go r.StartRound()
}

// StartRound begins a new round with a new question.
func (r *Room) StartRound() {
	r.mu.Lock()

	if r.GameState.Status != domain.RoomInProgress {
		r.mu.Unlock()
		return
	}

	r.GameState.CurrentRound++
	r.GameState.RoundActive = true
	r.GameState.Answered = make(map[string]bool)

	// Generate question
	question, err := game.GenerateQuestion(r.GameState.GameMode, r.GameState.UsedCountries)
	if err != nil {
		log.Printf("Error generating question for room %s: %v", r.ID, err)
		r.mu.Unlock()
		r.EndGame()
		return
	}

	r.GameState.Question = question
	r.GameState.UsedCountries[question.CountryCode] = true

	// Set time limit
	timeLimit := 15
	if r.GameState.GameMode == "WORLD_MAP" {
		timeLimit = 0 // Unlimited for map mode
		r.GameState.TimeRemaining = 0
	} else {
		r.GameState.TimeRemaining = timeLimit
	}

	r.mu.Unlock()

	log.Printf("Round %d started in room %s: %s",
		r.GameState.CurrentRound, r.ID, question.CountryName)

	r.BroadcastMessage("round_started", r.GameState)

	// Start countdown timer if timed mode
	if timeLimit > 0 {
		go r.startCountdownTimer(timeLimit)
	}
}

// startCountdownTimer runs the countdown for a round.
func (r *Room) startCountdownTimer(duration int) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	deadline := time.Now().Add(time.Duration(duration) * time.Second).Unix()

	// Store deadline in Redis for sync
	if redisClient.Client != nil {
		ctx := context.Background()
		redisClient.SetTimerDeadline(ctx, r.ID, r.GameState.CurrentRound, deadline)
	}

	for {
		select {
		case <-ticker.C:
			r.mu.Lock()

			if !r.GameState.RoundActive {
				r.mu.Unlock()
				return
			}

			r.GameState.TimeRemaining--
			timeRemaining := r.GameState.TimeRemaining
			r.mu.Unlock()

			// Broadcast time update
			r.BroadcastMessage("timer_update", map[string]interface{}{
				"time_remaining": timeRemaining,
			})

			// End round when time expires
			if timeRemaining <= 0 {
				r.EndRound()
				return
			}

		case <-r.ctx.Done():
			return
		}
	}
}

// EndRound concludes the current round and determines next action.
func (r *Room) EndRound() {
	r.mu.Lock()

	if !r.GameState.RoundActive {
		r.mu.Unlock()
		return
	}

	r.GameState.RoundActive = false
	correctAnswer := r.GameState.Question.CountryName
	currentRound := r.GameState.CurrentRound
	totalRounds := r.GameState.TotalRounds

	r.mu.Unlock()

	log.Printf("Round %d ended in room %s. Correct answer: %s",
		currentRound, r.ID, correctAnswer)

	// Clear Redis timer
	if redisClient.Client != nil {
		ctx := context.Background()
		redisClient.ClearTimer(ctx, r.ID)
	}

	// Broadcast round results
	r.BroadcastMessage("round_ended", map[string]interface{}{
		"correct_answer": correctAnswer,
		"scores":         r.GameState.Scores,
	})

	// Handle LAST_STANDING elimination
	if r.GameState.GameMode == "LAST_STANDING" {
		// Mark players who didn't answer correctly as eliminated
		r.mu.Lock()
		if r.GameState.EliminatedPlayers == nil {
			r.GameState.EliminatedPlayers = make(map[string]bool)
		}
		
		for username := range r.GameState.Scores {
			// Skip already eliminated players
			if r.GameState.EliminatedPlayers[username] {
				continue
			}
			// Eliminate players who didn't answer correctly
			if !r.GameState.Answered[username] {
				r.GameState.EliminatedPlayers[username] = true
				log.Printf("Player %s eliminated in room %s (no correct answer)", username, r.ID)
			}
		}
		r.mu.Unlock()
		
		r.handleLastStandingElimination()

		// Check if game should end
		r.mu.RLock()
		activePlayers := 0
		for username := range r.GameState.Scores {
			if !r.GameState.EliminatedPlayers[username] {
				activePlayers++
			}
		}
		r.mu.RUnlock()

		if activePlayers <= 1 {
			time.Sleep(2 * time.Second)
			r.EndGame()
			return
		}
	}

	// Check if game is complete
	if currentRound >= totalRounds {
		time.Sleep(1 * time.Second)
		r.EndGame()
	} else {
		// Start next round after delay
		time.Sleep(2 * time.Second)
		r.StartRound()
	}
}

// EndGame concludes the game and updates player statistics.
func (r *Room) EndGame() {
	r.mu.Lock()
	r.GameState.Status = domain.RoomCompleted
	r.GameState.RoundActive = false

	// Calculate final scores
	scores := make(map[string]int)
	for username, score := range r.GameState.Scores {
		scores[username] = score
	}

	r.mu.Unlock()

	log.Printf("Game ended in room %s. Final scores: %v", r.ID, scores)

	// Update player stats in database
	go r.UpdatePlayerStats(scores)

	// Broadcast game completion
	r.BroadcastMessage("game_completed", map[string]interface{}{
		"final_scores": scores,
	})
}

// assignTeams distributes players into RED and BLUE teams.
func (r *Room) assignTeams() {
	if r.GameState.Teams == nil {
		r.GameState.Teams = make(map[string]string)
	}

	unassigned := []string{}
	for client := range r.Clients {
		if r.GameState.Teams[client.Username] == "" {
			unassigned = append(unassigned, client.Username)
		}
	}

	teams := []string{"RED", "BLUE"}
	for i, username := range unassigned {
		r.GameState.Teams[username] = teams[i%2]
		log.Printf("Auto-assigned %s to team %s", username, teams[i%2])
	}
}
