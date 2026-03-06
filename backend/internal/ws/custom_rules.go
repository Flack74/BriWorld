package ws

import (
	"briworld/internal/models"
	"briworld/internal/database"
)

type CustomRules struct {
	TimeLimit       int    `json:"time_limit"`
	AllowHints      bool   `json:"allow_hints"`
	RegionFilter    string `json:"region_filter"`
	DifficultyLevel string `json:"difficulty_level"`
	MaxPlayers      int    `json:"max_players"`
	MinPlayers      int    `json:"min_players"`
}

func (r *Room) ApplyCustomRules(rules *CustomRules) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if rules.TimeLimit > 0 {
		if r.GameState.Question != nil {
			r.GameState.Question.TimeLimit = rules.TimeLimit
		}
	}
	
	// Save to database
	db := database.GetDB()
	if db != nil {
		customRule := &models.CustomRoomRule{
			RoomID:          r.ID,
			TimeLimit:       rules.TimeLimit,
			AllowHints:      rules.AllowHints,
			RegionFilter:    rules.RegionFilter,
			DifficultyLevel: rules.DifficultyLevel,
		}
		db.DB.Create(customRule)
	}
}

func (r *Room) GetCustomRules() *CustomRules {
	db := database.GetDB()
	if db == nil {
		return &CustomRules{
			TimeLimit:       15,
			AllowHints:      true,
			DifficultyLevel: "NORMAL",
			MaxPlayers:      6,
			MinPlayers:      1,
		}
	}
	
	var rule models.CustomRoomRule
	if err := db.DB.Where("room_id = ?", r.ID).First(&rule).Error; err != nil {
		return &CustomRules{
			TimeLimit:       15,
			AllowHints:      true,
			DifficultyLevel: "NORMAL",
			MaxPlayers:      6,
			MinPlayers:      1,
		}
	}
	
	return &CustomRules{
		TimeLimit:       rule.TimeLimit,
		AllowHints:      rule.AllowHints,
		RegionFilter:    rule.RegionFilter,
		DifficultyLevel: rule.DifficultyLevel,
		MaxPlayers:      6,
		MinPlayers:      1,
	}
}
