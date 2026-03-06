package models

import (
	"time"
	"github.com/google/uuid"
)

type DailyChallenge struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Date        time.Time `gorm:"uniqueIndex;not null" json:"date"`
	GameMode    string    `gorm:"size:20;not null" json:"game_mode"`
	Difficulty  string    `gorm:"size:20;not null" json:"difficulty"`
	CountryCode string    `gorm:"size:3" json:"country_code,omitempty"`
	Reward      int       `gorm:"default:100" json:"reward"`
	CreatedAt   time.Time `json:"created_at"`
}

type ChallengeCompletion struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	ChallengeID uuid.UUID `gorm:"type:uuid;not null;index" json:"challenge_id"`
	Score       int       `gorm:"default:0" json:"score"`
	CompletedAt time.Time `json:"completed_at"`
}

type Season struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name      string     `gorm:"size:100;not null" json:"name"`
	StartDate time.Time  `gorm:"not null" json:"start_date"`
	EndDate   time.Time  `gorm:"not null" json:"end_date"`
	IsActive  bool       `gorm:"default:false" json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
}

type SeasonRank struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID   uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	SeasonID uuid.UUID `gorm:"type:uuid;not null;index" json:"season_id"`
	Rank     string    `gorm:"size:20;default:BRONZE" json:"rank"`
	Points   int       `gorm:"default:0" json:"points"`
	Wins     int       `gorm:"default:0" json:"wins"`
	Losses   int       `gorm:"default:0" json:"losses"`
}

type CountryMastery struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CountryCode string    `gorm:"size:3;not null;index" json:"country_code"`
	Level       int       `gorm:"default:1" json:"level"`
	XP          int       `gorm:"default:0" json:"xp"`
	Correct     int       `gorm:"default:0" json:"correct"`
	Incorrect   int       `gorm:"default:0" json:"incorrect"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Achievement struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Code        string    `gorm:"uniqueIndex;size:50;not null" json:"code"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"size:255" json:"description"`
	Icon        string    `gorm:"size:50" json:"icon"`
	Reward      int       `gorm:"default:50" json:"reward"`
	Rarity      string    `gorm:"size:20;default:COMMON" json:"rarity"`
	CreatedAt   time.Time `json:"created_at"`
}

type UserAchievement struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	AchievementID uuid.UUID `gorm:"type:uuid;not null;index" json:"achievement_id"`
	UnlockedAt    time.Time `json:"unlocked_at"`
}

type CustomRoomRule struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	RoomID          string    `gorm:"size:8;not null;index" json:"room_id"`
	TimeLimit       int       `gorm:"default:15" json:"time_limit"`
	AllowHints      bool      `gorm:"default:true" json:"allow_hints"`
	RegionFilter    string    `gorm:"size:50" json:"region_filter,omitempty"`
	DifficultyLevel string    `gorm:"size:20;default:NORMAL" json:"difficulty_level"`
	CreatedAt       time.Time `json:"created_at"`
}
