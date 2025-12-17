package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                  uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Username            string     `gorm:"uniqueIndex;size:32;not null" json:"username"`
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

type UserResponse struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	AvatarURL   string    `json:"avatar_url,omitempty"`
	TotalPoints int       `json:"total_points"`
	TotalGames  int       `json:"total_games"`
	WinStreak   int       `json:"win_streak"`
}
