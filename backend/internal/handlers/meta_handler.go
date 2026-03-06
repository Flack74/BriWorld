package handlers

import (
	"briworld/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var metaService = services.NewMetaService()

func GetDailyChallenge(c *fiber.Ctx) error {
	challenge, err := metaService.GetTodayChallenge()
	if err != nil || challenge == nil {
		return c.JSON(fiber.Map{"challenge": nil})
	}
	return c.JSON(challenge)
}

func CompleteChallenge(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := userIDVal.(uuid.UUID)
	
	var req struct {
		ChallengeID string `json:"challenge_id"`
		Score       int    `json:"score"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}
	
	challengeID, _ := uuid.Parse(req.ChallengeID)
	if err := metaService.CompleteChallenge(userID, challengeID, req.Score); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to complete challenge"})
	}
	
	return c.JSON(fiber.Map{"success": true})
}

func GetUserRank(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := userIDVal.(uuid.UUID)
	
	season, err := metaService.GetActiveSeason()
	if err != nil {
		// Return default rank if no season
		return c.JSON(fiber.Map{
			"rank": "BRONZE",
			"points": 0,
			"wins": 0,
			"losses": 0,
		})
	}
	
	rank, err := metaService.GetUserRank(userID, season.ID)
	if err != nil {
		// Return default rank on error
		return c.JSON(fiber.Map{
			"rank": "BRONZE",
			"points": 0,
			"wins": 0,
			"losses": 0,
		})
	}
	
	return c.JSON(rank)
}

func GetUserMastery(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := userIDVal.(uuid.UUID)
	
	masteries, err := metaService.GetUserMastery(userID)
	if err != nil {
		return c.JSON(fiber.Map{"masteries": []interface{}{}})
	}
	
	return c.JSON(fiber.Map{"masteries": masteries})
}

func GetUserAchievements(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := userIDVal.(uuid.UUID)
	
	achievements, err := metaService.GetUserAchievements(userID)
	if err != nil {
		return c.JSON(fiber.Map{"achievements": []interface{}{}})
	}
	
	return c.JSON(fiber.Map{"achievements": achievements})
}
