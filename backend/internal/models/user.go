package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                  uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Username            string     `gorm:"uniqueIndex:idx_users_username;size:32;not null" json:"username"`
	Email               string     `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash        string     `gorm:"size:255;not null" json:"-"`
	AvatarURL           string     `gorm:"size:255" json:"avatar_url,omitempty"`
	SessionID           string     `gorm:"size:255;index" json:"session_id,omitempty"`
	LastActive          *time.Time `json:"last_active,omitempty"`
	IsActive            bool       `gorm:"default:true" json:"is_active"`
	EmailVerified       bool       `gorm:"default:false" json:"email_verified"`
	VerificationToken   string     `gorm:"size:64" json:"-"`
	ResetToken          string     `gorm:"size:64" json:"-"`
	ResetTokenExpiry    *time.Time `json:"-"`
	TotalPoints         int        `gorm:"default:0" json:"total_points"`
	TotalGames          int        `gorm:"default:0" json:"total_games"`
	TotalWins           int        `gorm:"default:0" json:"total_wins"`
	WinStreak           int        `gorm:"default:0" json:"win_streak"`
	LongestWinStreak    int        `gorm:"default:0" json:"longest_win_streak"`
	CountriesMastered   int        `gorm:"default:0" json:"countries_mastered"`
	FavoriteColor       string     `gorm:"size:7;default:#4A90A4" json:"favorite_color"`
	// Ranking System
	Rating              int        `gorm:"default:1000" json:"rating"`
	Rank                string     `gorm:"size:20;default:BRONZE" json:"rank"`
	RankTier            int        `gorm:"default:3" json:"rank_tier"`
	SeasonID            *uuid.UUID `gorm:"type:uuid" json:"season_id,omitempty"`
	PlacementMatches    int        `gorm:"default:0" json:"placement_matches"`
	IsPlacementComplete bool       `gorm:"default:false" json:"is_placement_complete"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type Room struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	RoomCode       string    `gorm:"uniqueIndex;size:8;not null" json:"room_code"`
	RoomName       string    `gorm:"size:100;not null" json:"room_name"`
	RoomType       string    `gorm:"size:20;default:PUBLIC" json:"room_type"`
	GameMode       string    `gorm:"size:20;not null" json:"game_mode"`
	CreatedBy      uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	MaxPlayers     int       `gorm:"default:6" json:"max_players"`
	CurrentPlayers int       `gorm:"default:0" json:"current_players"`
	CreatedAt      time.Time `json:"created_at"`
	StartedAt      *time.Time `json:"started_at,omitempty"`
	EndedAt        *time.Time `json:"ended_at,omitempty"`
}

type GameSession struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	RoomID    uuid.UUID `gorm:"type:uuid;not null;index" json:"room_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Score     int       `gorm:"default:0" json:"score"`
	Rank      int       `json:"rank"`
	Correct   int       `gorm:"default:0" json:"correct"`
	Incorrect int       `gorm:"default:0" json:"incorrect"`
	CreatedAt time.Time `json:"created_at"`
	EndedAt   *time.Time `json:"ended_at,omitempty"`
}

type RankHistory struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	SeasonID  uuid.UUID `gorm:"type:uuid;not null;index" json:"season_id"`
	OldRank   string    `gorm:"size:20" json:"old_rank"`
	NewRank   string    `gorm:"size:20" json:"new_rank"`
	OldRating int       `json:"old_rating"`
	NewRating int       `json:"new_rating"`
	CreatedAt time.Time `json:"created_at"`
}

type UserResponse struct {
	ID                  uuid.UUID `json:"id"`
	Username            string    `json:"username"`
	Email               string    `json:"email"`
	AvatarURL           string    `json:"avatar_url,omitempty"`
	TotalPoints         int       `json:"total_points"`
	TotalGames          int       `json:"total_games"`
	WinStreak           int       `json:"win_streak"`
	Rating              int       `json:"rating"`
	Rank                string    `json:"rank"`
	RankTier            int       `json:"rank_tier"`
	IsPlacementComplete bool      `json:"is_placement_complete"`
}
