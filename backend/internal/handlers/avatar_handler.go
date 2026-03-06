package handlers

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AvatarHandler struct {
	db  *database.GormDB
	cld *cloudinary.Cloudinary
}

func NewAvatarHandler(db *database.GormDB) *AvatarHandler {
	var cld *cloudinary.Cloudinary
	var err error

	// Try to initialize from environment variable first
	cloudinaryURL := os.Getenv("CLOUDINARY_API_ENVIRONMENT_VARIABLE")
	if cloudinaryURL != "" {
		cld, err = cloudinary.NewFromURL(cloudinaryURL)
		if err != nil {
			log.Printf("Warning: Failed to initialize Cloudinary from URL: %v", err)
		}
	}

	// Fallback: Initialize from individual credentials
	if cld == nil {
		cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
		if cloudName == "" {
			cloudName = os.Getenv("CLOUDINARY_ClOUD_NAME") // Fallback for typo
		}
		apiKey := os.Getenv("CLOUDINARY_API_KEY")
		apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

		if cloudName != "" && apiKey != "" && apiSecret != "" {
			cld, err = cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
			if err != nil {
				log.Printf("Warning: Failed to initialize Cloudinary from params: %v", err)
			}
		}
	}

	if cld == nil {
		log.Printf("Warning: Cloudinary not configured - avatars will not be uploaded")
	}

	return &AvatarHandler{db: db, cld: cld}
}

// UploadAvatar handles avatar file upload to Cloudinary
func (h *AvatarHandler) UploadAvatar(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	var userID uuid.UUID
	
	switch v := userIDVal.(type) {
	case uuid.UUID:
		userID = v
	case string:
		var err error
		userID, err = uuid.Parse(v)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid user ID",
			})
		}
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
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
	filename := strings.ToLower(file.Filename)
	allowedExts := []string{".jpg", ".jpeg", ".png", ".webp"}
	validExt := false
	for _, ext := range allowedExts {
		if strings.HasSuffix(filename, ext) {
			validExt = true
			break
		}
	}

	if !validExt {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only JPG, PNG, and WebP files are allowed",
		})
	}

	// Check if Cloudinary is configured
	if h.cld == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Avatar upload service not configured",
		})
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to read file",
		})
	}
	defer src.Close()

	// Upload to Cloudinary
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	uploadResult, err := h.cld.Upload.Upload(ctx, src, uploader.UploadParams{
		PublicID: fmt.Sprintf("briworld/avatars/%s", userID.String()),
		Folder:   "briworld/avatars",
	})

	if err != nil {
		log.Printf("Error uploading to Cloudinary: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to upload avatar",
		})
	}

	// Update user's avatar URL
	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", uploadResult.SecureURL).Error; err != nil {
		log.Printf("Error updating avatar URL: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update avatar",
		})
	}

	return c.JSON(fiber.Map{
		"message":    "Avatar uploaded successfully",
		"avatar_url": uploadResult.SecureURL,
	})
}

// DeleteAvatar handles avatar deletion
func (h *AvatarHandler) DeleteAvatar(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	var userID uuid.UUID
	
	switch v := userIDVal.(type) {
	case uuid.UUID:
		userID = v
	case string:
		var err error
		userID, err = uuid.Parse(v)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid user ID",
			})
		}
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	// Delete from Cloudinary
	if h.cld != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		_, err := h.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID: fmt.Sprintf("briworld/avatars/%s", userID.String()),
		})
		if err != nil {
			log.Printf("Warning: Failed to delete from Cloudinary: %v", err)
		}
	}

	// Update user's avatar URL to empty
	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", "").Error; err != nil {
		log.Printf("Error updating avatar URL: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete avatar",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Avatar deleted successfully",
	})
}
