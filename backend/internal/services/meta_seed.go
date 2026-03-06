package services

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"log"
	"time"
)

func SeedMetaSystem() {
	db := database.GetDB()
	if db == nil {
		log.Println("⚠️  Database not available, skipping meta seed")
		return
	}

	// Create active season if none exists
	var season models.Season
	if err := db.DB.Where("is_active = ?", true).First(&season).Error; err != nil {
		season = models.Season{
			Name:      "Season 1",
			StartDate: time.Now().AddDate(0, -1, 0),
			EndDate:   time.Now().AddDate(0, 2, 0),
			IsActive:  true,
		}
		db.DB.Create(&season)
		log.Println("✓ Created Season 1")
	}

	// Seed achievements
	achievements := []models.Achievement{
		{Code: "FIRST_WIN", Name: "First Victory", Description: "Win your first game", Icon: "🏆", Reward: 50, Rarity: "COMMON"},
		{Code: "WIN_STREAK_5", Name: "Hot Streak", Description: "Win 5 games in a row", Icon: "🔥", Reward: 100, Rarity: "RARE"},
		{Code: "WIN_STREAK_10", Name: "Unstoppable", Description: "Win 10 games in a row", Icon: "⚡", Reward: 200, Rarity: "EPIC"},
		{Code: "AFRICA_EXPERT", Name: "Africa Expert", Description: "Answer 50 African countries correctly", Icon: "🌍", Reward: 150, Rarity: "RARE"},
		{Code: "ASIA_EXPERT", Name: "Asia Expert", Description: "Answer 50 Asian countries correctly", Icon: "🌏", Reward: 150, Rarity: "RARE"},
		{Code: "EUROPE_EXPERT", Name: "Europe Expert", Description: "Answer 50 European countries correctly", Icon: "🌍", Reward: 150, Rarity: "RARE"},
		{Code: "AMERICAS_EXPERT", Name: "Americas Expert", Description: "Answer 50 American countries correctly", Icon: "🌎", Reward: 150, Rarity: "RARE"},
		{Code: "SPEED_DEMON", Name: "Speed Demon", Description: "Average response time under 5 seconds", Icon: "⚡", Reward: 100, Rarity: "RARE"},
		{Code: "PERFECTIONIST", Name: "Perfectionist", Description: "Complete a game with 100% accuracy", Icon: "💯", Reward: 200, Rarity: "EPIC"},
		{Code: "WORLD_TRAVELER", Name: "World Traveler", Description: "Master 100 countries", Icon: "✈️", Reward: 300, Rarity: "LEGENDARY"},
		{Code: "DAILY_GRIND", Name: "Daily Grind", Description: "Complete 7 daily challenges in a row", Icon: "📅", Reward: 150, Rarity: "RARE"},
		{Code: "RANKED_WARRIOR", Name: "Ranked Warrior", Description: "Reach Gold rank", Icon: "🥇", Reward: 250, Rarity: "EPIC"},
		{Code: "DIAMOND_LEAGUE", Name: "Diamond League", Description: "Reach Diamond rank", Icon: "💎", Reward: 500, Rarity: "LEGENDARY"},
	}

	for _, ach := range achievements {
		var existing models.Achievement
		if err := db.DB.Where("code = ?", ach.Code).First(&existing).Error; err != nil {
			db.DB.Create(&ach)
		}
	}
	log.Println("✓ Achievements seeded")
}
