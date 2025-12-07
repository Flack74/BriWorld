package ws

import (
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"briworld/internal/game"
)

type Room struct {
	ID          string
	Clients     map[*Client]bool
	Broadcast   chan []byte
	Register    chan *Client
	Unregister  chan *Client
	GameState   *GameState
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
	Answered       map[string]bool   `json:"-"`
	RoundActive    bool              `json:"-"`
	UsedCountries  map[string]bool   `json:"-"`
}

type Question struct {
	Type       string `json:"type"`
	FlagCode   string `json:"flag_code,omitempty"`
	CountryName string `json:"country_name"`
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
	r.Clients[client] = true
	client.Room = r
	r.GameState.Scores[client.Username] = 0
	if client.RoundsCount > 0 {
		r.GameState.TotalRounds = client.RoundsCount
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
	}
	r.mu.Unlock()

	r.SendPlayerLeft(client.Username)
	r.BroadcastRoomUpdate()
}

func (r *Room) HandleMessage(client *Client, msg *Message) {
	switch msg.Type {
	case "start_game":
		r.StartGame()
	case "submit_answer":
		r.HandleAnswer(client, msg.Payload)
	case "chat_message":
		r.BroadcastChatMessage(client.Username, msg.Payload)
	}
}

func (r *Room) StartGame() {
	r.mu.Lock()
	if r.GameState.Status != "waiting" || len(r.Clients) < 1 {
		r.mu.Unlock()
		return
	}
	r.GameState.Status = "in_progress"
	r.GameState.CurrentRound = 1
	r.mu.Unlock()

	r.StartRound()
}

func (r *Room) StartRound() {
	var code, name string
	for {
		code, name = game.GetRandomCountry()
		_, used := r.GameState.UsedCountries[code]
		if !used && !game.IsCountryExcluded(code) {
			break
		}
	}
	
	question := &Question{
		Type:        "FLAG_GUESS",
		FlagCode:    code,
		CountryName: name,
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
	r.mu.Unlock()

	r.BroadcastMessage("round_started", r.GameState)

	go func() {
		for i := question.TimeLimit; i > 0; i-- {
			time.Sleep(1 * time.Second)
			r.mu.RLock()
			active := r.GameState.RoundActive
			r.mu.RUnlock()
			if !active {
				return
			}
			r.mu.Lock()
			r.GameState.TimeRemaining = i - 1
			r.mu.Unlock()
		}
		r.mu.Lock()
		if r.GameState.RoundActive {
			r.GameState.RoundActive = false
			r.mu.Unlock()
			r.EndRound()
		} else {
			r.mu.Unlock()
		}
	}()
}



func (r *Room) HandleAnswer(client *Client, payload interface{}) {
	data, _ := json.Marshal(payload)
	var answer struct {
		Answer string `json:"answer"`
		Time   int    `json:"response_time_ms"`
	}
	json.Unmarshal(data, &answer)

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
	// Case-insensitive exact match only
	isCorrect := strings.EqualFold(strings.TrimSpace(answer.Answer), strings.TrimSpace(correctAnswer))
	
	if isCorrect {
		points := 100 - (answer.Time / 1000 * 5)
		if points < 25 {
			points = 25
		}
		r.GameState.Scores[client.Username] += points
		r.GameState.Answered[client.Username] = true
	}
	
	allAnswered := len(r.GameState.Answered) == len(r.Clients)
	r.mu.Unlock()

	// Only broadcast if correct
	if isCorrect {
		r.BroadcastMessage("answer_submitted", map[string]interface{}{
			"player":       client.Username,
			"is_correct":   true,
			"country_name": correctAnswer,
		})
		
		r.BroadcastMessage("score_update", map[string]interface{}{
			"scores": r.GameState.Scores,
		})
		
		if allAnswered || len(r.Clients) == 1 {
			r.mu.Lock()
			if r.GameState.RoundActive {
				r.GameState.RoundActive = false
				r.mu.Unlock()
				go func() {
					time.Sleep(2 * time.Second)
					r.EndRound()
				}()
			} else {
				r.mu.Unlock()
			}
		}
	}
}

func (r *Room) EndRound() {
	r.mu.Lock()
	correctAnswer := r.GameState.Question.CountryName
	r.GameState.CurrentRound++
	if r.GameState.CurrentRound > r.GameState.TotalRounds {
		r.GameState.Status = "completed"
		r.mu.Unlock()
		r.BroadcastMessage("game_completed", r.GameState)
		return
	}
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


