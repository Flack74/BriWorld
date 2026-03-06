package game

import "briworld/internal/domain"

type State struct {
	Status            domain.RoomStatus              `json:"status"`
	CurrentRound      int                            `json:"current_round"`
	TotalRounds       int                            `json:"total_rounds"`
	Question          *Question                      `json:"question"`
	Scores            map[string]int                 `json:"scores"`
	TimeRemaining     int                            `json:"time_remaining"`
	GameMode          string                         `json:"game_mode"`
	RoomType          string                         `json:"room_type"`
	MapMode           string                         `json:"map_mode"`
	Answered          map[string]bool                `json:"answered"`
	RoundActive       bool                           `json:"round_active"`
	UsedCountries     map[string]bool                `json:"-"`
	PaintedCountries  map[string]string              `json:"painted_countries"`
	PlayerColors      map[string]string              `json:"player_colors"`
	Teams             map[string]string              `json:"teams"`
	EliminatedPlayers map[string]bool                `json:"eliminated_players"`
	ActivePlayers     int                            `json:"active_players"`
	MessageReactions  map[string]map[string][]string `json:"message_reactions"` // messageID -> emoji -> []usernames
}

type Question struct {
	Type                 string   `json:"type"`
	FlagCode             string   `json:"flag_code"`
	CountryName          string   `json:"country_name"`
	CountryCode          string   `json:"country_code"`
	TimeLimit            int      `json:"time_limit"`
	Emoji                string   `json:"emoji,omitempty"`
	Silhouette           string   `json:"silhouette,omitempty"`
	SilhouetteUnavailable bool    `json:"silhouette_unavailable,omitempty"`
	Capital              string   `json:"capital,omitempty"`
	Neighbors            []string `json:"neighbors,omitempty"`
}

func NewState() *State {
	return &State{
		Status:            domain.RoomWaiting,
		TotalRounds:       10,
		Scores:            make(map[string]int),
		Answered:          make(map[string]bool),
		UsedCountries:     make(map[string]bool),
		PaintedCountries:  make(map[string]string),
		PlayerColors:      make(map[string]string),
		Teams:             make(map[string]string),
		EliminatedPlayers: make(map[string]bool),
		MessageReactions:  make(map[string]map[string][]string),
	}
}
