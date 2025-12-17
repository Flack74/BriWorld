package ws

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"briworld/internal/game"
	"briworld/internal/utils"
)

type Room struct {
	ID          string
	Clients     map[*Client]bool
	Broadcast   chan []byte
	Register    chan *Client
	Unregister  chan *Client
	GameState   *GameState
	Owner       string
	mu          sync.RWMutex
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
	return &Room{
		ID:         id,
		Clients:    make(map[*Client]bool),
		Broadcast:  make(chan []byte, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		GameState: &GameState{
			Status:      "waiting",
			TotalRounds: 10,
			Scores:      make(map[string]int),
			GameMode:    "FLAG",
			Answered:    make(map[string]bool),
			RoundActive: false,
			PaintedCountries: make(map[string]string),
			PlayerColors: make(map[string]string),
		},
	}
}

func (r *Room) Run() {
	for {
		select {
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
	}
}

func (r *Room) SetMapMode(payload interface{}) {
	data, _ := json.Marshal(payload)
	var mode struct {
		MapPlayMode string `json:"map_play_mode"`
	}
	json.Unmarshal(data, &mode)
	
	r.mu.Lock()
	r.GameState.MapMode = mode.MapPlayMode
	r.mu.Unlock()
	
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
		r.mu.Unlock()
		return
	}
	// Require at least 2 players for multiplayer rooms
	minPlayers := 1
	if r.GameState.RoomType == "PUBLIC" || r.GameState.RoomType == "PRIVATE" {
		minPlayers = 2
	}
	if r.GameState.Status != "waiting" || len(r.Clients) < minPlayers {
		r.mu.Unlock()
		return
	}
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
		r.mu.Unlock()
		// Include painted countries in the broadcast
	r.mu.RLock()
	gameStateCopy := *r.GameState
	r.mu.RUnlock()
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
		log.Printf("TIMED mode: Setting CurrentCountry to %s (%s)", code, name)
	}
	r.mu.Unlock()

	// Include painted countries in the broadcast
	r.mu.RLock()
	gameStateCopy := *r.GameState
	log.Printf("Broadcasting round_started: CurrentCountry=%s, MapMode=%s", gameStateCopy.CurrentCountry, gameStateCopy.MapMode)
	r.mu.RUnlock()
	r.BroadcastMessage("round_started", gameStateCopy)

	// Start countdown timer for all modes except FREE map mode
	if !(r.GameState.GameMode == "WORLD_MAP" && r.GameState.MapMode == "FREE") {
		go func() {
			for i := 0; i < question.TimeLimit; i++ {
				time.Sleep(1 * time.Second)
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
			time.Sleep(2 * time.Second)
			r.EndRound()
		}()
	}
}

func (r *Room) EndRound() {
	r.mu.Lock()
	correctAnswer := r.GameState.Question.CountryName
	currentRound := r.GameState.CurrentRound
	
	// Check if this was the last round
	if currentRound >= r.GameState.TotalRounds {
		r.GameState.Status = "completed"
		r.mu.Unlock()
		
		// Broadcast round ended first, then game completed
		r.BroadcastMessage("round_ended", map[string]interface{}{
			"scores":         r.GameState.Scores,
			"current_round":  currentRound,
			"correct_answer": correctAnswer,
			"is_last_round":  true,
		})
		
		// Wait 4 seconds for timeout banner to show if needed
		time.Sleep(4 * time.Second)
		r.BroadcastMessage("game_completed", r.GameState)
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
	time.Sleep(3 * time.Second)
	r.StartRound()
}

func (r *Room) BroadcastMessage(msgType string, payload interface{}) {
	msg := Message{Type: msgType, Payload: payload}
	data, _ := json.Marshal(msg)
	r.Broadcast <- data
}

func (r *Room) BroadcastRoomUpdate() {
	r.mu.RLock()
	players := make([]string, 0, len(r.Clients))
	for client := range r.Clients {
		players = append(players, client.Username)
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
