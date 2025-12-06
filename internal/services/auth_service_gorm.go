package services

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"briworld/internal/utils"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type AuthServiceGorm struct {
	db *database.GormDB
}

func NewAuthServiceGorm(db *database.GormDB) *AuthServiceGorm {
	return &AuthServiceGorm{db: db}
}

func (s *AuthServiceGorm) RegisterUser(ctx context.Context, username, email, passwordHash string) (*models.User, error) {
	user := &models.User{
		Username:     username,
		Email:        email,
		PasswordHash: passwordHash,
	}

	if err := s.db.DB.WithContext(ctx).Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (s *AuthServiceGorm) LoginUser(ctx context.Context, email, password string) (*models.User, error) {
	var user models.User
	if err := s.db.DB.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		return nil, fmt.Errorf("user not found")
	}

	if !utils.VerifyPassword(user.PasswordHash, password) {
		return nil, fmt.Errorf("invalid password")
	}

	return &user, nil
}

func (s *AuthServiceGorm) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := s.db.DB.WithContext(ctx).First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthServiceGorm) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := s.db.DB.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthServiceGorm) UpdateResetToken(ctx context.Context, userID uuid.UUID, token string, expiry time.Time) error {
	return s.db.DB.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"reset_token": token,
		"reset_token_expiry": expiry,
	}).Error
}

func (s *AuthServiceGorm) ResetPassword(ctx context.Context, token, newPasswordHash string) error {
	var user models.User
	if err := s.db.DB.WithContext(ctx).Where("reset_token = ? AND reset_token_expiry > ?", token, time.Now()).First(&user).Error; err != nil {
		return fmt.Errorf("invalid or expired token")
	}
	return s.db.DB.WithContext(ctx).Model(&user).Updates(map[string]interface{}{
		"password_hash": newPasswordHash,
		"reset_token": nil,
		"reset_token_expiry": nil,
	}).Error
}
