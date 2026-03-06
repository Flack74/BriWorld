package services

import (
	"briworld/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SeasonService struct {
	db *gorm.DB
}

func NewSeasonService(db *gorm.DB) *SeasonService {
	return &SeasonService{db: db}
}

// CreateSeason creates a new ranked season
func (ss *SeasonService) CreateSeason(name string, durationDays int) (*models.Season, error) {
	// End current active season
	ss.db.Model(&models.Season{}).Where("is_active = ?", true).Update("is_active", false)
	
	season := &models.Season{
		ID:        uuid.New(),
		Name:      name,
		StartDate: time.Now(),
		EndDate:   time.Now().AddDate(0, 0, durationDays),
		IsActive:  true,
	}
	
	if err := ss.db.Create(season).Error; err != nil {
		return nil, err
	}
	
	return season, nil
}

// GetActiveSeason returns the current active season
func (ss *SeasonService) GetActiveSeason() (*models.Season, error) {
	var season models.Season
	err := ss.db.Where("is_active = ?", true).First(&season).Error
	return &season, err
}

// ResetUserRatings performs soft reset on all users for new season
func (ss *SeasonService) ResetUserRatings(seasonID uuid.UUID) error {
	var users []models.User
	if err := ss.db.Find(&users).Error; err != nil {
		return err
	}
	
	for _, user := range users {
		oldRating := user.Rating
		oldRank := user.Rank
		
		// Soft reset formula: (oldRating * 0.75) + 300
		newRating := int(float64(oldRating)*0.75) + 300
		newRank, newTier := models.GetRankFromRating(newRating)
		
		// Save rank history
		history := models.RankHistory{
			ID:        uuid.New(),
			UserID:    user.ID,
			SeasonID:  seasonID,
			OldRank:   oldRank,
			NewRank:   newRank,
			OldRating: oldRating,
			NewRating: newRating,
		}
		ss.db.Create(&history)
		
		// Update user
		user.Rating = newRating
		user.Rank = newRank
		user.RankTier = newTier
		user.SeasonID = &seasonID
		user.PlacementMatches = 0
		user.IsPlacementComplete = false
		
		ss.db.Save(&user)
	}
	
	return nil
}
