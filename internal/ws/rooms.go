package ws

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"briworld/internal/database"
	"briworld/internal/game"
	"briworld/internal/utils"
)

type Room struct {
	ID                    string
	Clients               map[*Client]bool
	Broadcast             chan []byte
	Register              chan *Client
	Unregister            chan *Client
	GameState             *GameState
	Owner                 string
	mu                    sync.RWMutex
	ctx                   context.Context
	cancel                context.CancelFunc
	inactiveRoundCount    int
	isCleanedUp           bool
}

type GameState struct {
	Status         string            `json:"status"` // waiting, in_progress, completed
	CurrentRound   int               `json:"current_round"`
	TotalRounds    int               `json:"total_rounds"`
	Question       *Question         `json:"question,omitempty"`
	Scores         map[string]int    `json:"scores"`
	TimeRemaining  int               `json:"time_remaining"`
	GameMode       string            `json:"game_mode"` // FLAG, WORLD_MAP
	RoomType       string            `json:"room_type"` // SINGLE, PRIVATE, PUBLIC
	MapMode        string            `json:"map_mode"`  // TIMED, FREE
	Owner          string            `json:"owner"`
	Answered       map[string]bool   `json:"-"`
	RoundActive    bool              `json:"-"`
	UsedCountries  map[string]bool   `json:"-"`
	PaintedCountries map[string]string `json:"painted_countries"` // country_code -> username
	CurrentCountry string            `json:"current_country"` // For TIMED map mode
	PlayerColors   map[string]string `json:"player_colors"` // username -> color
}

type Question struct {
	Type       string `json:"type"`
	FlagCode   string `json:"flag_code,omitempty"`
	CountryName string `json:"country_name"`
	CountryCode string `json:"country_code,omitempty"`
	TimeLimit  int    `json:"time_limit"`
}

func NewRoom(id string) *Room {
	ctx, cancel := context.WithCancel(context.Background())
	return &Room{
		ID:                 id,
		Clients:            make(map[*Client]bool),
		Broadcast:          make(chan []byte, 256),
		Register:           make(chan *Client),
		Unregister:         make(chan *Client),
		ctx:                ctx,
		cancel:             cancel,
		inactiveRoundCount: 0,
		isCleanedUp:        false,
		GameState: &GameState{
			Status:           "waiting",
			TotalRounds:      10,
			Scores:           make(map[string]int),
			GameMode:         "FLAG",
			Answered:         make(map[string]bool),
			RoundActive:      false,
			PaintedCountries: make(map[string]string),
			PlayerColors:     make(map[string]string),
		},
	}
}

func (r *Room) Run() {
	for {
		select {
		case <-r.ctx.Done():
			log.Printf("Room %s context cancelled, stopping", r.ID)
			return
			
		case client := <-r.Register:
			r.AddClient(client)

		case client := <-r.Unregister:
			r.RemoveClient(client)

		case message := <-r.Broadcast:
			r.mu.RLock()
			for client := range r.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(r.Clients, client)
				}
			}
			r.mu.RUnlock()
		}
	}
}

func (r *Room) AddClient(client *Client) {
	r.mu.Lock()
	
	// Reset inactivity counter when user connects
	r.inactiveRoundCount = 0
	
	// Check for duplicate session (reconnection vs collision)
	var existingClient *Client
	for c := range r.Clients {
		if c.SessionID == client.SessionID && c.SessionID != "" {
			existingClient = c
			break
		}
	}
	
	// If duplicate session found, check if it's a reconnection or collision
	if existingClient != nil {
		// Check if connection is still alive
		if existingClient.Conn != nil {
			log.Printf("Active session collision detected: %s (session: %s)", client.Username, client.SessionID)
			r.mu.Unlock()
			
			// Send collision message to new client
			msg := Message{
				Type: "session_collision",
				Payload: map[string]interface{}{
					"message": "This session is already active in this room",
					"username": existingClient.Username,
				},
			}
			data, _ := json.Marshal(msg)
			client.Send <- data
			return
		} else {
			// Old connection is dead, allow reconnection
			log.Printf("Reconnection detected: %s (session: %s)", client.Username, client.SessionID)
			delete(r.Clients, existingClient)
		}
	}
	
	isFirstPlayer := len(r.Clients) == 0
	r.Clients[client] = true
	client.Room = r
	r.GameState.Scores[client.Username] = 0
	if client.RoundsCount > 0 {
		r.GameState.TotalRounds = client.RoundsCount
	}
	if client.GameMode != "" {
		r.GameState.GameMode = client.GameMode
	}
	if client.RoomType != "" {
		r.GameState.RoomType = client.RoomType
	}
	if isFirstPlayer {
		r.Owner = client.Username
		r.GameState.Owner = client.Username
	}
	
	// Send current game state to new player if game in progress
	if r.GameState.Status == "in_progress" && r.GameState.Question != nil {
		msg := Message{Type: "round_started", Payload: r.GameState}
		data, _ := json.Marshal(msg)
		client.Send <- data
	}
	r.mu.Unlock()

	// Save room state
	GetStateManager().SaveRoomState(r)

	r.BroadcastRoomUpdate()
	r.SendPlayerJoined(client.Username)
}

func (r *Room) RemoveClient(client *Client) {
	r.mu.Lock()
	if _, ok := r.Clients[client]; ok {
		delete(r.Clients, client)
		close(client.Send)
		
		// Transfer ownership if owner leaves
		if r.Owner == client.Username && len(r.Clients) > 0 {
			for nextClient := range r.Clients {
				r.Owner = nextClient.Username
				r.GameState.Owner = nextClient.Username
				break
			}
		}
	}
	r.mu.Unlock()

	// Save room state after client removal
	GetStateManager().SaveRoomState(r)
	
	r.SendPlayerLeft(client.Username)
	r.BroadcastRoomUpdate()
}

func (r *Room) HandleMessage(client *Client, msg *Message) {
	switch msg.Type {
	case "start_game":
		r.StartGame(client.Username)
	case "submit_answer":
		r.HandleAnswer(client, msg.Payload)
	case "chat_message":
		r.BroadcastChatMessage(client.Username, msg.Payload)
	case "set_map_mode":
		r.SetMapMode(msg.Payload)
	case "set_rounds":
		r.SetRounds(msg.Payload)
	case "color_selected":
		r.SetPlayerColor(client, msg.Payload)
	case "restart_game":
		r.RestartGame(client.Username)
	case "close_room":
		r.CloseRoom(client.Username)
	}
}

func (r *Room) SetMapMode(payload interface{}) {
	// Always force FREE mode for WORLD_MAP
	r.mu.Lock()
	r.GameState.MapMode = "FREE"
	r.mu.Unlock()
	
	log.Printf("Map mode set to FREE (TIMED mode disabled)")
	r.BroadcastRoomUpdate()
}

func (r *Room) SetRounds(payload interface{}) {
	data, _ := json.Marshal(payload)
	var rounds struct {
		Rounds int `json:"rounds"`
	}
	json.Unmarshal(data, &rounds)
	
	r.mu.Lock()
	if rounds.Rounds > 0 {
		r.GameState.TotalRounds = rounds.Rounds
	}
	r.mu.Unlock()
	
	r.BroadcastRoomUpdate()
}

func (r *Room) StartGame(username string) {
	r.mu.Lock()
	// Only owner can start game
	if r.Owner != username {
		log.Printf("StartGame rejected: %s is not owner (owner: %s)", username, r.Owner)
		r.mu.Unlock()
		return
	}
	// Require at least 2 players for multiplayer rooms
	minPlayers := 1
	if r.GameState.RoomType == "PUBLIC" || r.GameState.RoomType == "PRIVATE" {
		minPlayers = 2
	}
	if r.GameState.Status != "waiting" || len(r.Clients) < minPlayers {
		log.Printf("StartGame rejected: status=%s, players=%d, minPlayers=%d", r.GameState.Status, len(r.Clients), minPlayers)
		r.mu.Unlock()
		return
	}
	
	// For WORLD_MAP, auto-set to FREE mode
	if r.GameState.GameMode == "WORLD_MAP" && r.GameState.MapMode == "" {
		r.GameState.MapMode = "FREE"
		log.Printf("Auto-setting WORLD_MAP to FREE mode")
	}
	
	log.Printf("Starting game: room=%s, mode=%s, mapMode=%s, rounds=%d", r.ID, r.GameState.GameMode, r.GameState.MapMode, r.GameState.TotalRounds)
	r.GameState.Status = "in_progress"
	r.GameState.CurrentRound = 1
	r.mu.Unlock()

	r.StartRound()
}

func (r *Room) StartRound() {
	// FREE mode doesn't need rounds
	if r.GameState.GameMode == "WORLD_MAP" && r.GameState.MapMode == "FREE" {
		r.mu.Lock()
		r.GameState.Status = "in_progress"
		r.GameState.CurrentRound = 1
		r.mu.Unlock()
		// Include painted countries in the broadcast
		r.mu.RLock()
		gameStateCopy := *r.GameState
		r.mu.RUnlock()
		log.Printf("FREE mode started for room %s", r.ID)
		r.BroadcastMessage("game_started", gameStateCopy)
		return
	}
	
	var code, name string
	// For TIMED map mode, select a random country to highlight
	if r.GameState.GameMode == "WORLD_MAP" && r.GameState.MapMode == "TIMED" {
		for {
			code, name = game.GetRandomCountry()
			_, used := r.GameState.UsedCountries[code]
			if !used && !game.IsCountryExcluded(code) {
				break
			}
		}
	} else {
		// For FLAG mode, also select random country
		for {
			code, name = game.GetRandomCountry()
			_, used := r.GameState.UsedCountries[code]
			if !used && !game.IsCountryExcluded(code) {
				break
			}
		}
	}
	
	questionType := "FLAG_GUESS"
	if r.GameState.GameMode == "WORLD_MAP" {
		questionType = "MAP_GUESS"
	}
	
	question := &Question{
		Type:        questionType,
		FlagCode:    code,
		CountryName: name,
		CountryCode: code,
		TimeLimit:   15,
	}

	r.mu.Lock()
	r.GameState.Question = question
	r.GameState.TimeRemaining = question.TimeLimit
	r.GameState.Answered = make(map[string]bool)
	r.GameState.RoundActive = true
	if r.GameState.UsedCountries == nil {
		r.GameState.UsedCountries = make(map[string]bool)
	}
	r.GameState.UsedCountries[code] = true
	// For TIMED map mode, set current country to highlight
	if r.GameState.GameMode == "WORLD_MAP" && r.GameState.MapMode == "TIMED" {
		r.GameState.CurrentCountry = code
		log.Printf("TIMED mode: Round %d - CurrentCountry set to %s (%s)", r.GameState.CurrentRound, code, name)
	} else {
		log.Printf("FLAG mode: Round %d - Country %s (%s)", r.GameState.CurrentRound, code, name)
	}
	r.mu.Unlock()

	// Include painted countries in the broadcast
	r.mu.RLock()
	gameStateCopy := *r.GameState
	log.Printf("Broadcasting round_started to %d clients: CurrentCountry=%s, MapMode=%s, GameMode=%s", len(r.Clients), gameStateCopy.CurrentCountry, gameStateCopy.MapMode, gameStateCopy.GameMode)
	r.mu.RUnlock()
	r.BroadcastMessage("round_started", gameStateCopy)

	// Start countdown timer for all modes except FREE map mode
	if !(r.GameState.GameMode == "WORLD_MAP" && r.GameState.MapMode == "FREE") {
		go func() {
			ticker := time.NewTicker(1 * time.Second)
			defer ticker.Stop()
			
			for i := 0; i < question.TimeLimit; i++ {
				select {
				case <-ticker.C:
					r.mu.RLock()
					active := r.GameState.RoundActive
					status := r.GameState.Status
					r.mu.RUnlock()
					if !active || status == "completed" {
						return
					}
					r.mu.Lock()
					r.GameState.TimeRemaining = question.TimeLimit - i - 1
					r.mu.Unlock()
					
					// Broadcast timer update
					r.BroadcastMessage("timer_update", map[string]interface{}{
						"time_remaining": question.TimeLimit - i - 1,
					})
				case <-r.ctx.Done():
					return
				}
			}
			
			r.mu.Lock()
			if r.GameState.RoundActive && r.GameState.Status != "completed" {
				r.GameState.RoundActive = false
				r.mu.Unlock()
				r.EndRound()
			} else {
				r.mu.Unlock()
			}
		}()
	}
}



func (r *Room) HandleAnswer(client *Client, payload interface{}) {
	data, _ := json.Marshal(payload)
	var answer struct {
		Answer string `json:"answer"`
		Time   int    `json:"response_time_ms"`
	}
	json.Unmarshal(data, &answer)

	// FREE mode - match against any country (only for WORLD_MAP)
	if r.GameState.GameMode == "WORLD_MAP" && r.GameState.MapMode == "FREE" {
		code, name := game.FindCountryByName(answer.Answer)
		if code != "" {
			r.mu.Lock()
			// Check if country already painted
			if _, exists := r.GameState.PaintedCountries[code]; exists {
				r.mu.Unlock()
				// Country already guessed
				r.BroadcastMessage("answer_submitted", map[string]interface{}{
					"player":       client.Username,
					"is_correct":   false,
					"country_name": name,
				})
				return
			}
			
			// Mark country as painted by this user
			r.GameState.PaintedCountries[code] = client.Username
			if r.GameState.Scores[client.Username] == 0 {
				r.GameState.Scores[client.Username] = 1
			} else {
				r.GameState.Scores[client.Username]++
			}
			log.Printf("Player %s scored! New score: %d", client.Username, r.GameState.Scores[client.Username])
			r.mu.Unlock()
			
			r.BroadcastMessage("answer_submitted", map[string]interface{}{
				"player":       client.Username,
				"is_correct":   true,
				"country_name": name,
				"country_code": code,
			})
			
			r.mu.RLock()
			playerColors := r.GameState.PlayerColors
			r.mu.RUnlock()
			log.Printf("Broadcasting country_painted: %s painted by %s with color %s", code, client.Username, playerColors[client.Username])
			r.BroadcastMessage("country_painted", map[string]interface{}{
				"country_code": code,
				"country_name": name,
				"player":       client.Username,
				"painted_countries": r.GameState.PaintedCountries,
				"player_colors": playerColors,
			})
			
			r.BroadcastMessage("score_update", map[string]interface{}{
				"scores": r.GameState.Scores,
			})
		}
		return
	}

	r.mu.Lock()
	// Allow multiple attempts - only check if round is active
	if !r.GameState.RoundActive {
		r.mu.Unlock()
		return
	}
	
	// Check if already answered correctly
	if r.GameState.Answered[client.Username] {
		r.mu.Unlock()
		return
	}
	
	correctAnswer := r.GameState.Question.CountryName
	// Use fuzzy matching to accept close answers
	isCorrect := utils.FuzzyMatch(answer.Answer, correctAnswer, 2)
	countryCode := r.GameState.Question.CountryCode
	
	if isCorrect {
		points := 100 - (answer.Time / 1000 * 5)
		if points < 25 {
			points = 25
		}
		r.GameState.Scores[client.Username] += points
		r.GameState.Answered[client.Username] = true
		
		// For TIMED map mode, mark country as painted
		if r.GameState.GameMode == "WORLD_MAP" && r.GameState.MapMode == "TIMED" {
			r.GameState.PaintedCountries[countryCode] = client.Username
		}
		
		// Stop the round immediately when correct answer is given
		r.GameState.RoundActive = false
	}
	r.mu.Unlock()

	// Only broadcast if correct
	if isCorrect {
		r.BroadcastMessage("answer_submitted", map[string]interface{}{
			"player":       client.Username,
			"is_correct":   true,
			"country_name": correctAnswer,
			"country_code": countryCode,
		})
		
		// Broadcast painted country for map modes
		if r.GameState.GameMode == "WORLD_MAP" {
			r.mu.RLock()
			playerColors := r.GameState.PlayerColors
			r.mu.RUnlock()
			r.BroadcastMessage("country_painted", map[string]interface{}{
				"country_code": countryCode,
				"country_name": correctAnswer,
				"player":       client.Username,
				"painted_countries": r.GameState.PaintedCountries,
				"player_colors": playerColors,
			})
		}
		
		r.BroadcastMessage("score_update", map[string]interface{}{
			"scores": r.GameState.Scores,
		})
		
		// Move to next round after 2 seconds
		go func() {
			select {
			case <-time.After(2 * time.Second):
				r.EndRound()
			case <-r.ctx.Done():
				return
			}
		}()
	}
}

func (r *Room) EndRound() {
	r.mu.Lock()
	correctAnswer := r.GameState.Question.CountryName
	currentRound := r.GameState.CurrentRound
	
	// Check inactivity at end of each round
	if len(r.Clients) == 0 {
		r.inactiveRoundCount++
		log.Printf("Room %s inactive for %d rounds", r.ID, r.inactiveRoundCount)
		
		if r.inactiveRoundCount >= 3 {
			log.Printf("Room %s inactive for 3 rounds, scheduling cleanup", r.ID)
			r.mu.Unlock()
			go r.AutoCleanup()
			return
		}
	} else {
		r.inactiveRoundCount = 0
	}
	
	// Check if this was the last round
	if currentRound >= r.GameState.TotalRounds {
		r.GameState.Status = "completed"
		scores := make(map[string]int)
		for k, v := range r.GameState.Scores {
			scores[k] = v
		}
		r.mu.Unlock()
		
		// Update player stats
		go r.UpdatePlayerStats(scores)
		
		// Broadcast round ended first, then game completed
		r.BroadcastMessage("round_ended", map[string]interface{}{
			"scores":         scores,
			"current_round":  currentRound,
			"correct_answer": correctAnswer,
			"is_last_round":  true,
		})
		
		// Wait 4 seconds for timeout banner to show if needed
		select {
		case <-time.After(4 * time.Second):
			r.BroadcastMessage("game_completed", r.GameState)
		case <-r.ctx.Done():
			return
		}
		return
	}
	
	r.GameState.CurrentRound++
	r.GameState.CurrentCountry = ""
	r.mu.Unlock()

	r.BroadcastMessage("round_ended", map[string]interface{}{
		"scores":         r.GameState.Scores,
		"current_round":  r.GameState.CurrentRound,
		"correct_answer": correctAnswer,
	})
	
	select {
	case <-time.After(3 * time.Second):
		r.StartRound()
	case <-r.ctx.Done():
		return
	}
}

func (r *Room) BroadcastMessage(msgType string, payload interface{}) {
	msg := Message{Type: msgType, Payload: payload}
	data, _ := json.Marshal(msg)
	r.Broadcast <- data
}

func (r *Room) BroadcastRoomUpdate() {
	r.mu.RLock()
	players := make([]string, 0, len(r.Clients))
	playerAvatars := make(map[string]string)
	for client := range r.Clients {
		players = append(players, client.Username)
		playerAvatars[client.Username] = client.AvatarURL
	}
	r.mu.RUnlock()

	r.BroadcastMessage("room_update", map[string]interface{}{
		"players":        players,
		"current_count":  len(players),
		"status":         r.GameState.Status,
		"current_round":  r.GameState.CurrentRound,
		"owner":          r.Owner,
		"game_mode":      r.GameState.GameMode,
		"room_type":      r.GameState.RoomType,
		"map_mode":       r.GameState.MapMode,
		"total_rounds":   r.GameState.TotalRounds,
		"player_colors":  r.GameState.PlayerColors,
		"player_avatars": playerAvatars,
	})
}

func (r *Room) SendPlayerJoined(username string) {
	r.BroadcastMessage("player_joined", map[string]interface{}{
		"player_name":   username,
		"current_count": len(r.Clients),
	})
}

func (r *Room) SendPlayerLeft(username string) {
	r.BroadcastMessage("player_left", map[string]interface{}{
		"player_name":   username,
		"current_count": len(r.Clients),
	})
}

func (r *Room) SetPlayerColor(client *Client, payload interface{}) {
	data, _ := json.Marshal(payload)
	var colorData struct {
		Color string `json:"color"`
	}
	json.Unmarshal(data, &colorData)
	
	r.mu.Lock()
	// Check if color is already taken by another player
	for username, color := range r.GameState.PlayerColors {
		if color == colorData.Color && username != client.Username {
			log.Printf("Color %s already taken by %s, rejecting for %s", colorData.Color, username, client.Username)
			// Send error message to client
			r.mu.Unlock()
			msg := Message{
				Type: "color_rejected",
				Payload: map[string]interface{}{
					"error": "Color already taken",
					"color": colorData.Color,
				},
			}
			data, _ := json.Marshal(msg)
			client.Send <- data
			return
		}
	}
	r.GameState.PlayerColors[client.Username] = colorData.Color
	r.mu.Unlock()
	
	r.BroadcastRoomUpdate()
}

func (r *Room) BroadcastChatMessage(username string, payload interface{}) {
	data, _ := json.Marshal(payload)
	var chat struct {
		Message string `json:"message"`
	}
	json.Unmarshal(data, &chat)

	r.BroadcastMessage("chat_message", map[string]interface{}{
		"player_name": username,
		"message":     chat.Message,
		"timestamp":   time.Now().Format(time.RFC3339),
	})
	
	log.Printf("Chat in room %s - %s: %s", r.ID, username, chat.Message)
}



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
	r.GameState.CurrentCountry = ""
	
	// For single player, start immediately. For multiplayer, go to waiting room
	if r.GameState.RoomType == "SINGLE" {
		r.GameState.Status = "in_progress"
		r.GameState.CurrentRound = 1
		r.mu.Unlock()
		r.StartRound()
	} else {
		r.GameState.Status = "waiting"
		r.mu.Unlock()
		r.BroadcastMessage("game_restarted", r.GameState)
		r.BroadcastRoomUpdate()
	}
}

func (r *Room) CloseRoom(username string) {
	r.mu.Lock()
	if r.Owner != username {
		r.mu.Unlock()
		return
	}
	if r.isCleanedUp {
		r.mu.Unlock()
		return
	}
	r.GameState.Status = "closed"
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
	
	// Clean up state and remove from hub
	GetStateManager().DeleteRoomState(roomID)
	GlobalHub.RemoveRoom(roomID)
	log.Printf("Room %s closed and removed by %s", roomID, username)
}

func (r *Room) UpdatePlayerStats(scores map[string]int) {
	log.Printf("Updating player stats for room %s with scores: %v", r.ID, scores)
	
	// Find winner
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
		
		log.Printf("Updating %s: score=%d, isWinner=%v, maxScore=%d", username, score, isWinner, maxScore)
		
		if db := database.GetDB(); db != nil {
			if err := db.DB.Exec(`
				UPDATE users 
				SET total_points = total_points + ?,
					total_games = total_games + 1,
					total_wins = total_wins + ?,
					win_streak = CASE WHEN ? THEN win_streak + 1 ELSE 0 END,
					longest_win_streak = CASE WHEN ? AND win_streak + 1 > longest_win_streak THEN win_streak + 1 ELSE longest_win_streak END
				WHERE username = ?
			`, score, winValue, isWinner, isWinner, username).Error; err != nil {
				log.Printf("Error updating stats for %s: %v", username, err)
			} else {
				log.Printf("Successfully updated stats for %s", username)
			}
		}
	}
}

func (r *Room) AutoCleanup() {
	r.mu.Lock()
	if r.isCleanedUp {
		r.mu.Unlock()
		return
	}
	if len(r.Clients) > 0 {
		// Users reconnected, cancel cleanup
		r.inactiveRoundCount = 0
		r.mu.Unlock()
		log.Printf("Room %s cleanup cancelled - users reconnected", r.ID)
		return
	}
	
	r.GameState.Status = "closed"
	r.GameState.RoundActive = false
	roomID := r.ID
	r.isCleanedUp = true
	r.mu.Unlock()
	
	// Cancel context to stop all goroutines
	r.cancel()
	
	// Clean up state and remove from hub
	GetStateManager().DeleteRoomState(roomID)
	GlobalHub.RemoveRoom(roomID)
	log.Printf("Room %s auto-cleaned due to inactivity", roomID)
}
