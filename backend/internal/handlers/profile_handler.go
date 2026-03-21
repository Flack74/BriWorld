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
	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	var user models.User
	if err := h.db.DB.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	var decorations []models.ProfileDecoration
	if err := h.db.DB.Where("user_id = ?", userID).Order("z_index asc, created_at asc").Find(&decorations).Error; err != nil {
		log.Printf("Error loading profile decorations: %v", err)
	}

	return c.JSON(fiber.Map{
		"id":                         user.ID,
		"username":                   user.Username,
		"email":                      user.Email,
		"avatar_url":                 user.AvatarURL,
		"avatar_type":                user.AvatarType,
		"banner_url":                 user.BannerURL,
		"banner_type":                user.BannerType,
		"avatar_decoration_preset":   user.AvatarDecorationPreset,
		"avatar_decoration_url":      user.AvatarDecorationURL,
		"profile_customization_json": user.ProfileCustomizationJSON,
		"decorations":                decorations,
		"total_points":               user.TotalPoints,
		"total_games":                user.TotalGames,
		"total_wins":                 user.TotalWins,
		"win_streak":                 user.WinStreak,
		"longest_win_streak":         user.LongestWinStreak,
		"countries_mastered":         user.CountriesMastered,
		"favorite_color":             user.FavoriteColor,
		"rating":                     user.Rating,
		"rank":                       user.Rank,
		"rank_tier":                  user.RankTier,
		"placement_matches":          user.PlacementMatches,
		"is_placement_complete":      user.IsPlacementComplete,
		"created_at":                 user.CreatedAt,
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
	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	var req struct {
		Username                 *string `json:"username"`
		AvatarDecorationPreset   *string `json:"avatar_decoration_preset"`
		ProfileCustomizationJSON *string `json:"profile_customization_json"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	updates := map[string]interface{}{}

	if req.Username != nil {
		if len(*req.Username) < 3 || len(*req.Username) > 32 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Username must be between 3 and 32 characters",
			})
		}

		var existingUser models.User
		if err := h.db.DB.Where("username = ? AND id != ?", *req.Username, userID).First(&existingUser).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Username already taken",
			})
		}

		updates["username"] = *req.Username
	}

	if req.AvatarDecorationPreset != nil {
		updates["avatar_decoration_preset"] = *req.AvatarDecorationPreset
	}

	if req.ProfileCustomizationJSON != nil {
		updates["profile_customization_json"] = *req.ProfileCustomizationJSON
	}

	if len(updates) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No profile updates provided",
		})
	}

	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		log.Printf("Error updating profile: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update profile",
		})
	}

	usernameResponse := ""
	if req.Username != nil {
		usernameResponse = *req.Username
	}
	decorationResponse := ""
	if req.AvatarDecorationPreset != nil {
		decorationResponse = *req.AvatarDecorationPreset
	}
	customizationResponse := ""
	if req.ProfileCustomizationJSON != nil {
		customizationResponse = *req.ProfileCustomizationJSON
	}

	return c.JSON(fiber.Map{
		"message":                    "Profile updated successfully",
		"username":                   usernameResponse,
		"avatar_decoration_preset":   decorationResponse,
		"profile_customization_json": customizationResponse,
	})
}

func (h *ProfileHandler) SaveCustomization(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID format"})
	}

	var req struct {
		ProfileCustomizationJSON string `json:"profile_customization_json"`
		Decorations              []struct {
			AssetID    *string `json:"asset_id"`
			Name       string  `json:"name"`
			Source     string  `json:"source"`
			AssetType  string  `json:"asset_type"`
			Target     string  `json:"target"`
			AssetURL   string  `json:"asset_url"`
			PositionX  float64 `json:"position_x"`
			PositionY  float64 `json:"position_y"`
			Scale      float64 `json:"scale"`
			Rotation   float64 `json:"rotation"`
			ZIndex     int     `json:"z_index"`
			Loop       bool    `json:"loop"`
			Speed      float64 `json:"speed"`
			Enabled    bool    `json:"enabled"`
			ConfigJSON string  `json:"config_json"`
		} `json:"decorations"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	validTypes := map[string]bool{"image": true, "gif": true, "lottie": true}
	validTargets := map[string]bool{"avatar": true, "banner": true}
	validSources := map[string]bool{"uploaded": true, "prebuilt": true}

	tx := h.db.DB.Begin()
	if tx.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to start transaction"})
	}

	if err := tx.Model(&models.User{}).
		Where("id = ?", userID).
		Update("profile_customization_json", req.ProfileCustomizationJSON).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save customization"})
	}

	if err := tx.Where("user_id = ?", userID).Delete(&models.ProfileDecoration{}).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to replace decorations"})
	}

	for _, decoration := range req.Decorations {
		if !validTypes[decoration.AssetType] || !validTargets[decoration.Target] || !validSources[decoration.Source] {
			tx.Rollback()
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid decoration payload"})
		}

		var assetID *uuid.UUID
		if decoration.AssetID != nil && *decoration.AssetID != "" {
			parsed, err := uuid.Parse(*decoration.AssetID)
			if err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid decoration asset ID"})
			}
			assetID = &parsed
		}

		row := models.ProfileDecoration{
			UserID:     userID,
			AssetID:    assetID,
			Name:       decoration.Name,
			Source:     decoration.Source,
			AssetType:  decoration.AssetType,
			Target:     decoration.Target,
			AssetURL:   decoration.AssetURL,
			PositionX:  decoration.PositionX,
			PositionY:  decoration.PositionY,
			Scale:      decoration.Scale,
			Rotation:   decoration.Rotation,
			ZIndex:     decoration.ZIndex,
			Loop:       decoration.Loop,
			Speed:      decoration.Speed,
			Enabled:    decoration.Enabled,
			ConfigJSON: decoration.ConfigJSON,
		}

		if err := tx.Create(&row).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save decorations"})
		}
	}

	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to finalize customization"})
	}

	return c.JSON(fiber.Map{"message": "Customization saved successfully"})
}

// DeleteAvatar removes the user's avatar
func (h *ProfileHandler) DeleteAvatar(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID format",
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
