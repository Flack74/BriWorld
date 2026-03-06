package services

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
)

type SessionService struct {
	db *database.GormDB
}

func NewSessionService(db *database.GormDB) *SessionService {
	return &SessionService{db: db}
}

// GenerateSessionID creates a unique session ID
func (s *SessionService) GenerateSessionID() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// CreateGuestSession creates a session for a guest user
func (s *SessionService) CreateGuestSession(username string) (*models.Session, error) {
	sessionID, err := s.GenerateSessionID()
	if err != nil {
		return nil, err
	}

	session := &models.Session{
		ID:        sessionID,
		Username:  username,
		IsGuest:   true,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := s.db.DB.Create(session).Error; err != nil {
		return nil, err
	}

	return session, nil
}

// CreateUserSession creates a session for a logged-in user
func (s *SessionService) CreateUserSession(userID uuid.UUID, username string) (*models.Session, error) {
	sessionID, err := s.GenerateSessionID()
	if err != nil {
		return nil, err
	}

	session := &models.Session{
		ID:        sessionID,
		Username:  username,
		UserID:    &userID,
		IsGuest:   false,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour), // 30 days for logged-in users
	}

	if err := s.db.DB.Create(session).Error; err != nil {
		return nil, err
	}

	// Update user's session ID
	now := time.Now()
	if err := s.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"session_id":  sessionID,
		"last_active": &now,
	}).Error; err != nil {
		return nil, err
	}

	return session, nil
}

// GetSession retrieves a session by ID
func (s *SessionService) GetSession(sessionID string) (*models.Session, error) {
	var session models.Session
	if err := s.db.DB.Where("id = ? AND expires_at > ?", sessionID, time.Now()).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

// ValidateSession checks if a session is valid
func (s *SessionService) ValidateSession(sessionID string) bool {
	var count int64
	s.db.DB.Model(&models.Session{}).Where("id = ? AND expires_at > ?", sessionID, time.Now()).Count(&count)
	return count > 0
}

// DeleteSession removes a session
func (s *SessionService) DeleteSession(sessionID string) error {
	return s.db.DB.Where("id = ?", sessionID).Delete(&models.Session{}).Error
}

// CleanupExpiredSessions removes expired sessions
func (s *SessionService) CleanupExpiredSessions() error {
	return s.db.DB.Where("expires_at < ?", time.Now()).Delete(&models.Session{}).Error
}

// UpdateSessionActivity updates the last active time
func (s *SessionService) UpdateSessionActivity(sessionID string) error {
	return s.db.DB.Model(&models.Session{}).Where("id = ?", sessionID).Update("expires_at", time.Now().Add(24*time.Hour)).Error
}
