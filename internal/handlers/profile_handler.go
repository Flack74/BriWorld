package handlers

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ProfileHandler struct {
	db *database.GormDB
}

func NewProfileHandler(db *database.GormDB) *ProfileHandler {
	return &ProfileHandler{db: db}
}

// GetProfile returns the current user's profile
func (h *ProfileHandler) GetProfile(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	userIDStr, ok := userIDVal.(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var user models.User
	if err := h.db.DB.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(fiber.Map{
		"id":                user.ID,
		"username":          user.Username,
		"email":             user.Email,
		"avatar_url":        user.AvatarURL,
		"total_points":      user.TotalPoints,
		"total_games":       user.TotalGames,
		"total_wins":        user.TotalWins,
		"win_streak":        user.WinStreak,
		"longest_win_streak": user.LongestWinStreak,
		"countries_mastered": user.CountriesMastered,
		"favorite_color":    user.FavoriteColor,
	})
}

// UpdateProfile updates the user's profile information
func (h *ProfileHandler) UpdateProfile(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	userIDStr, ok := userIDVal.(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var req struct {
		Username string `json:"username"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate username
	if len(req.Username) < 3 || len(req.Username) > 32 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username must be between 3 and 32 characters",
		})
	}

	// Check if username is already taken by another user
	var existingUser models.User
	if err := h.db.DB.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Username already taken",
		})
	}

	// Update username
	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Update("username", req.Username).Error; err != nil {
		log.Printf("Error updating username: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update username",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Profile updated successfully",
		"username": req.Username,
	})
}

// DeleteAvatar removes the user's avatar
func (h *ProfileHandler) DeleteAvatar(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	userIDStr, ok := userIDVal.(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", "").Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete avatar",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Avatar deleted successfully",
	})
}
