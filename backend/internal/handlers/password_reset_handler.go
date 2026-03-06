package handlers

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"briworld/internal/utils"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type PasswordResetHandler struct{}

func NewPasswordResetHandler() *PasswordResetHandler {
	return &PasswordResetHandler{}
}

// RequestPasswordReset sends a reset email
func (h *PasswordResetHandler) RequestPasswordReset(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	db := database.GetDB()
	if db == nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database unavailable"})
	}

	var user models.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Don't reveal if email exists
			return c.JSON(fiber.Map{"message": "If the email exists, a reset link has been sent"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	// Generate reset token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}
	token := hex.EncodeToString(tokenBytes)

	// Save token with expiry (1 hour)
	user.ResetToken = token
	user.ResetTokenExpiry = time.Now().Add(1 * time.Hour)
	if err := db.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save reset token"})
	}

	// Send email
	resetLink := c.BaseURL() + "/reset-password?token=" + token
	if err := utils.SendPasswordResetEmail(user.Email, user.Username, resetLink); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to send email"})
	}

	return c.JSON(fiber.Map{"message": "If the email exists, a reset link has been sent"})
}

// ResetPassword resets the password using token
func (h *PasswordResetHandler) ResetPassword(c *fiber.Ctx) error {
	var req struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if len(req.Password) < 8 {
		return c.Status(400).JSON(fiber.Map{"error": "Password must be at least 8 characters"})
	}

	db := database.GetDB()
	if db == nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database unavailable"})
	}

	var user models.User
	if err := db.DB.Where("reset_token = ?", req.Token).First(&user).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	// Check if token expired
	if time.Now().After(user.ResetTokenExpiry) {
		return c.Status(400).JSON(fiber.Map{"error": "Token has expired"})
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	// Update password and clear token
	user.PasswordHash = hashedPassword
	user.ResetToken = ""
	user.ResetTokenExpiry = time.Time{}
	if err := db.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update password"})
	}

	return c.JSON(fiber.Map{"message": "Password reset successful"})
}
