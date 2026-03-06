package ws

import (
	"briworld/internal/game"
	"briworld/internal/utils"
	redisClient "briworld/internal/redis"
	"context"
	"encoding/json"
	"log"
	"strings"
)

// HandleAnswer processes a player's answer submission.
func (r *Room) HandleAnswer(client *Client, payload interface{}) {
	// Spectators cannot answer
	if client.IsSpectator {
		return
	}

	r.mu.Lock()

	if !r.GameState.RoundActive {
		r.mu.Unlock()
		return
	}

	data, _ := json.Marshal(payload)
	var answerData struct {
		Answer string `json:"answer"`
	}
	json.Unmarshal(data, &answerData)

	answer := strings.TrimSpace(answerData.Answer)
	correctAnswer := r.GameState.Question.CountryName
	timeRemaining := r.GameState.TimeRemaining

	r.mu.Unlock()

	// Validate answer using fuzzy matching
	isCorrect := utils.FuzzyMatch(answer, correctAnswer, 2)

	r.mu.Lock()
	
	// If wrong answer, just ignore it and let player keep trying
	if !isCorrect {
		r.mu.Unlock()
		return
	}

	// Only process correct answers
	// Only count first correct answer
	if r.GameState.Answered[client.Username] {
		r.mu.Unlock()
		return
	}
	r.GameState.Answered[client.Username] = true

	// Calculate points based on time remaining (100 to 25 points)
	pointsEarned := 0
	if timeRemaining > 0 {
		pointsEarned = 25 + (timeRemaining * 5)
		if pointsEarned > 100 {
			pointsEarned = 100
		}
	} else {
		pointsEarned = 50 // Default for untimed modes
	}

	r.GameState.Scores[client.Username] += pointsEarned
	currentScore := r.GameState.Scores[client.Username]
	
	log.Printf("Player %s answered correctly in room %s (+%d points)",
		client.Username, r.ID, pointsEarned)

	r.mu.Unlock()

	// Broadcast correct answer to all players
	r.BroadcastMessage("answer_submitted", map[string]interface{}{
		"is_correct":    true,
		"player":        client.Username,
		"country_name":  correctAnswer,
		"points_earned": pointsEarned,
	})

	// Broadcast score update to all players
	r.BroadcastMessage("score_update", map[string]interface{}{
		"username": client.Username,
		"score":    currentScore,
		"scores":   r.GameState.Scores,
	})

	// For FLAG_QUIZ and LAST_STANDING, end round immediately after correct answer
	r.mu.RLock()
	gameMode := r.GameState.GameMode
	r.mu.RUnlock()
	
	if gameMode == "FLAG_QUIZ" || gameMode == "LAST_STANDING" {
		log.Printf("Correct answer submitted in room %s by %s, ending round", r.ID, client.Username)
		r.EndRound()
	}
}

// HandleMapPaint processes country painting in WORLD_MAP mode.
func (r *Room) HandleMapPaint(client *Client, payload interface{}) {
	// Spectators cannot paint
	if client.IsSpectator {
		return
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if r.GameState.GameMode != "WORLD_MAP" {
		return
	}

	data, _ := json.Marshal(payload)
	var paintData struct {
		CountryCode string `json:"country_code"`
	}
	json.Unmarshal(data, &paintData)

	input := strings.TrimSpace(paintData.CountryCode)
	
	// Try to find country by name first
	countryCode, _ := game.FindCountryByName(input)
	if countryCode == "" {
		// If not found by name, assume it's already a code
		countryCode = strings.ToUpper(input)
	}

	// Check if already painted
	if _, painted := r.GameState.PaintedCountries[countryCode]; painted {
		r.SendToClient(client, "paint_rejected", map[string]interface{}{
			"error": "Country already painted",
		})
		return
	}

	// Paint country
	r.GameState.PaintedCountries[countryCode] = client.Username
	r.GameState.Scores[client.Username] += 10

	log.Printf("Player %s painted %s in room %s", client.Username, countryCode, r.ID)

	// Sync to Redis
	if redisClient.Client != nil {
		ctx := context.Background()
		redisClient.PaintCountry(ctx, r.ID, countryCode, client.Username)
	}

	// Broadcast paint event
	r.BroadcastMessage("country_painted", map[string]interface{}{
		"country_code":      countryCode,
		"player":            client.Username,
		"painted_countries": r.GameState.PaintedCountries,
		"player_colors":     r.GameState.PlayerColors,
		"scores":            r.GameState.Scores,
	})
}
