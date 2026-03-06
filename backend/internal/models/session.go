package models

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID        string    `gorm:"primaryKey;size:255" json:"id"`
	Username  string    `gorm:"size:100;not null" json:"username"`
	UserID    *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	IsGuest   bool      `gorm:"default:true" json:"is_guest"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}
