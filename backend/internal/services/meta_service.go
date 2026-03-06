package services

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"math/rand"
	"time"
	"github.com/google/uuid"
)

type MetaService struct{}

func NewMetaService() *MetaService {
	return &MetaService{}
}

// Daily Challenges
func (s *MetaService) GetTodayChallenge() (*models.DailyChallenge, error) {
	db := database.GetDB()
	if db == nil {
		return nil, nil
	}
	today := time.Now().Truncate(24 * time.Hour)
	
	var challenge models.DailyChallenge
	if err := db.DB.Where("date = ?", today).First(&challenge).Error; err != nil {
		return s.GenerateDailyChallenge(today)
	}
	return &challenge, nil
}

func (s *MetaService) GenerateDailyChallenge(date time.Time) (*models.DailyChallenge, error) {
	modes := []string{"FLAG", "WORLD_MAP", "CAPITAL_RUSH", "SILHOUETTE", "EMOJI", "TEAM_BATTLE"}
	difficulties := []string{"EASY", "MEDIUM", "HARD"}
	
	challenge := &models.DailyChallenge{
		Date:       date,
		GameMode:   modes[rand.Intn(len(modes))],
		Difficulty: difficulties[rand.Intn(len(difficulties))],
		Reward:     100 + rand.Intn(200),
	}
	
	db := database.GetDB()
	if err := db.DB.Create(challenge).Error; err != nil {
		return nil, err
	}
	return challenge, nil
}

func (s *MetaService) CompleteChallenge(userID, challengeID uuid.UUID, score int) error {
	completion := &models.ChallengeCompletion{
		UserID:      userID,
		ChallengeID: challengeID,
		Score:       score,
		CompletedAt: time.Now(),
	}
	
	db := database.GetDB()
	return db.DB.Create(completion).Error
}

// Ranked Seasons
func (s *MetaService) GetActiveSeason() (*models.Season, error) {
	db := database.GetDB()
	if db == nil {
		return nil, nil
	}
	var season models.Season
	if err := db.DB.Where("is_active = ?", true).First(&season).Error; err != nil {
		return nil, err
	}
	return &season, nil
}

func (s *MetaService) GetUserRank(userID, seasonID uuid.UUID) (*models.SeasonRank, error) {
	db := database.GetDB()
	if db == nil {
		return &models.SeasonRank{Rank: "BRONZE", Points: 0}, nil
	}
	var rank models.SeasonRank
	if err := db.DB.Where("user_id = ? AND season_id = ?", userID, seasonID).First(&rank).Error; err != nil {
		rank = models.SeasonRank{
			UserID:   userID,
			SeasonID: seasonID,
			Rank:     "BRONZE",
			Points:   0,
		}
		db.DB.Create(&rank)
	}
	return &rank, nil
}

func (s *MetaService) UpdateRank(userID, seasonID uuid.UUID, points int, won bool) error {
	db := database.GetDB()
	rank, _ := s.GetUserRank(userID, seasonID)
	
	rank.Points += points
	if won {
		rank.Wins++
	} else {
		rank.Losses++
	}
	
	rank.Rank = s.CalculateRank(rank.Points)
	return db.DB.Save(rank).Error
}

func (s *MetaService) CalculateRank(points int) string {
	if points >= 2000 { return "DIAMOND" }
	if points >= 1500 { return "PLATINUM" }
	if points >= 1000 { return "GOLD" }
	if points >= 500 { return "SILVER" }
	return "BRONZE"
}

// Country Mastery
func (s *MetaService) UpdateMastery(userID uuid.UUID, countryCode string, correct bool) error {
	db := database.GetDB()
	var mastery models.CountryMastery
	
	if err := db.DB.Where("user_id = ? AND country_code = ?", userID, countryCode).First(&mastery).Error; err != nil {
		mastery = models.CountryMastery{
			UserID:      userID,
			CountryCode: countryCode,
			Level:       1,
			XP:          0,
		}
	}
	
	if correct {
		mastery.Correct++
		mastery.XP += 10
	} else {
		mastery.Incorrect++
		mastery.XP += 2
	}
	
	mastery.Level = 1 + (mastery.XP / 100)
	mastery.UpdatedAt = time.Now()
	
	return db.DB.Save(&mastery).Error
}

func (s *MetaService) GetUserMastery(userID uuid.UUID) ([]models.CountryMastery, error) {
	db := database.GetDB()
	if db == nil {
		return []models.CountryMastery{}, nil
	}
	var masteries []models.CountryMastery
	err := db.DB.Where("user_id = ?", userID).Order("level DESC, xp DESC").Limit(50).Find(&masteries).Error
	if err != nil {
		return []models.CountryMastery{}, nil
	}
	return masteries, nil
}

// Achievements
func (s *MetaService) CheckAchievements(userID uuid.UUID, stats map[string]int) []string {
	unlocked := []string{}
	
	achievements := map[string]func(int) bool{
		"FIRST_WIN":      func(v int) bool { return stats["wins"] >= 1 },
		"WIN_STREAK_5":   func(v int) bool { return stats["streak"] >= 5 },
		"AFRICA_EXPERT":  func(v int) bool { return stats["africa_correct"] >= 50 },
		"SPEED_DEMON":    func(v int) bool { return stats["avg_time"] < 5000 },
		"PERFECTIONIST": func(v int) bool { return stats["perfect_games"] >= 1 },
	}
	
	for code, check := range achievements {
		if check(0) && !s.HasAchievement(userID, code) {
			s.UnlockAchievement(userID, code)
			unlocked = append(unlocked, code)
		}
	}
	
	return unlocked
}

func (s *MetaService) HasAchievement(userID uuid.UUID, code string) bool {
	db := database.GetDB()
	var achievement models.Achievement
	if err := db.DB.Where("code = ?", code).First(&achievement).Error; err != nil {
		return false
	}
	
	var userAch models.UserAchievement
	err := db.DB.Where("user_id = ? AND achievement_id = ?", userID, achievement.ID).First(&userAch).Error
	return err == nil
}

func (s *MetaService) UnlockAchievement(userID uuid.UUID, code string) error {
	db := database.GetDB()
	var achievement models.Achievement
	if err := db.DB.Where("code = ?", code).First(&achievement).Error; err != nil {
		return err
	}
	
	userAch := &models.UserAchievement{
		UserID:        userID,
		AchievementID: achievement.ID,
		UnlockedAt:    time.Now(),
	}
	
	return db.DB.Create(userAch).Error
}

func (s *MetaService) GetUserAchievements(userID uuid.UUID) ([]models.Achievement, error) {
	db := database.GetDB()
	if db == nil {
		return []models.Achievement{}, nil
	}
	var achievements []models.Achievement
	
	err := db.DB.Joins("JOIN user_achievements ON user_achievements.achievement_id = achievements.id").
		Where("user_achievements.user_id = ?", userID).
		Find(&achievements).Error
	
	if err != nil {
		return []models.Achievement{}, nil
	}
	return achievements, nil
}
