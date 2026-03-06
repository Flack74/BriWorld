package handlers

import (
	"briworld/internal/models"
	"briworld/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type RankingHandler struct {
	db            *gorm.DB
	ratingService *services.RatingService
	seasonService *services.SeasonService
}

func NewRankingHandler(db *gorm.DB) *RankingHandler {
	return &RankingHandler{
		db:            db,
		ratingService: services.NewRatingService(),
		seasonService: services.NewSeasonService(db),
	}
}

// GetLeaderboard returns top players by rating
func (h *RankingHandler) GetLeaderboard(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 100)
	
	var users []models.User
	err := h.db.Select("id, username, avatar_url, rating, rank, rank_tier").
		Order("rating DESC").
		Limit(limit).
		Find(&users).Error
	
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch leaderboard"})
	}
	
	return c.JSON(fiber.Map{"leaderboard": users})
}

// GetUserRank returns user's rank and position
func (h *RankingHandler) GetUserRank(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	
	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	
	// Calculate position
	var position int64
	h.db.Model(&models.User{}).Where("rating > ?", user.Rating).Count(&position)
	position++ // Add 1 for current user's position
	
	return c.JSON(fiber.Map{
		"rating":               user.Rating,
		"rank":                 user.Rank,
		"rank_tier":            user.RankTier,
		"position":             position,
		"placement_matches":    user.PlacementMatches,
		"is_placement_complete": user.IsPlacementComplete,
	})
}

// GetActiveSeason returns current season info
func (h *RankingHandler) GetActiveSeason(c *fiber.Ctx) error {
	season, err := h.seasonService.GetActiveSeason()
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "No active season"})
	}
	
	return c.JSON(season)
}
