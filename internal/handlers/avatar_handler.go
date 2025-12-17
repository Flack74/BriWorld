package handlers

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AvatarHandler struct {
	db *database.GormDB
}

func NewAvatarHandler(db *database.GormDB) *AvatarHandler {
	return &AvatarHandler{db: db}
}

// UploadAvatar handles avatar file upload
func (h *AvatarHandler) UploadAvatar(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Get uploaded file
	file, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file uploaded",
		})
	}

	// Validate file size (max 2MB)
	if file.Size > 2*1024*1024 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File size must be less than 2MB",
		})
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}

	if !allowedExts[ext] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only JPG, PNG, and WebP files are allowed",
		})
	}

	// Create uploads directory if it doesn't exist
	uploadsDir := "./uploads/avatars"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		log.Printf("Error creating uploads directory: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create upload directory",
		})
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s_%d%s", userID.String(), time.Now().Unix(), ext)
	filepath := filepath.Join(uploadsDir, filename)

	// Save file
	if err := c.SaveFile(file, filepath); err != nil {
		log.Printf("Error saving file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	// Update user's avatar URL
	avatarURL := fmt.Sprintf("/uploads/avatars/%s", filename)
	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", avatarURL).Error; err != nil {
		log.Printf("Error updating avatar URL: %v", err)
		// Try to delete the uploaded file
		os.Remove(filepath)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update avatar",
		})
	}

	return c.JSON(fiber.Map{
		"message":    "Avatar uploaded successfully",
		"avatar_url": avatarURL,
	})
}
