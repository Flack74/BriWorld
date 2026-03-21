package handlers

import (
	"briworld/internal/config"
	"briworld/internal/models"
	"briworld/internal/services"
	"briworld/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RankingHandler struct {
	db            *gorm.DB
	ratingService *services.RatingService
	seasonService *services.SeasonService
	jwtSecret     string
}

func NewRankingHandler(db *gorm.DB, jwtSecret string) *RankingHandler {
	if jwtSecret == "" {
		jwtSecret = config.Load().JWT.Secret
	}
	return &RankingHandler{
		db:            db,
		ratingService: services.NewRatingService(),
		seasonService: services.NewSeasonService(db),
		jwtSecret:     jwtSecret,
	}
}

type leaderboardEntry struct {
	models.User
	Position int64 `json:"position"`
}

func leaderboardScope(db *gorm.DB) *gorm.DB {
	return db.Where("(total_games > 0 OR total_points > 0 OR rating > 1000)")
}

func (h *RankingHandler) resolveViewerID(c *fiber.Ctx) uuid.UUID {
	authHeader := strings.TrimSpace(c.Get("Authorization"))
	if authHeader == "" || !strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		return uuid.Nil
	}

	claims, err := utils.ValidateJWT(strings.TrimSpace(authHeader[7:]), h.jwtSecret)
	if err != nil {
		return uuid.Nil
	}

	viewerID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return uuid.Nil
	}

	return viewerID
}

// GetLeaderboard returns top players by rating
func (h *RankingHandler) GetLeaderboard(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 100)
	if limit <= 0 {
		limit = 100
	}
	if limit > 200 {
		limit = 200
	}

	var users []models.User
	err := leaderboardScope(h.db).
		Select("id, username, avatar_url, rating, rank, rank_tier, total_games, total_wins, total_points, updated_at").
		Order("rating DESC, total_points DESC, total_wins DESC, updated_at ASC, username ASC").
		Limit(limit).
		Find(&users).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch leaderboard"})
	}

	leaderboard := make([]leaderboardEntry, 0, len(users))
	for index, user := range users {
		leaderboard = append(leaderboard, leaderboardEntry{
			User:     user,
			Position: int64(index + 1),
		})
	}

	response := fiber.Map{"leaderboard": leaderboard}

	viewerID := h.resolveViewerID(c)
	if viewerID != uuid.Nil {
		var viewer models.User
		if err := h.db.First(&viewer, "id = ?", viewerID).Error; err == nil {
			var position int64
			leaderboardScope(h.db.Model(&models.User{})).
				Where(
					"(rating > ?) OR (rating = ? AND total_points > ?) OR (rating = ? AND total_points = ? AND total_wins > ?) OR (rating = ? AND total_points = ? AND total_wins = ? AND updated_at < ?) OR (rating = ? AND total_points = ? AND total_wins = ? AND updated_at = ? AND username < ?)",
					viewer.Rating,
					viewer.Rating, viewer.TotalPoints,
					viewer.Rating, viewer.TotalPoints, viewer.TotalWins,
					viewer.Rating, viewer.TotalPoints, viewer.TotalWins, viewer.UpdatedAt,
					viewer.Rating, viewer.TotalPoints, viewer.TotalWins, viewer.UpdatedAt, viewer.Username,
				).
				Count(&position)

			response["current_user"] = leaderboardEntry{
				User:     viewer,
				Position: position + 1,
			}
		}
	}

	return c.JSON(response)
}

// GetUserRank returns user's rank and position
func (h *RankingHandler) GetUserRank(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uuid.UUID)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Calculate position
	var position int64
	leaderboardScope(h.db.Model(&models.User{})).Where("rating > ?", user.Rating).Count(&position)
	position++ // Add 1 for current user's position

	return c.JSON(fiber.Map{
		"rating":                user.Rating,
		"rank":                  user.Rank,
		"rank_tier":             user.RankTier,
		"position":              position,
		"placement_matches":     user.PlacementMatches,
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
