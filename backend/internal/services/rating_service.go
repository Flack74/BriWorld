package services

import (
	"briworld/internal/models"
	"math"
)

type RatingService struct{}

func NewRatingService() *RatingService {
	return &RatingService{}
}

// CalculatePerformanceScore calculates score based on game performance
func (rs *RatingService) CalculatePerformanceScore(correct, incorrect int, avgSpeed float64, gameMode string) int {
	baseScore := correct*12 - incorrect*8
	speedBonus := int(avgSpeed * 6)
	return baseScore + speedBonus
}

// CalculateRatingChange returns the new rating after a match
func (rs *RatingService) CalculateRatingChange(oldRating, performanceScore int, gameMode string, isPlacement bool) int {
	multiplier := models.ModeMultipliers[gameMode]
	if multiplier == 0.0 {
		return oldRating // No rating change for casual modes
	}

	ratingChange := int(float64(performanceScore) * multiplier)
	
	// Placement matches have faster rating movement
	if isPlacement {
		ratingChange = int(float64(ratingChange) * 1.5)
	}

	// Cap rating changes
	ratingChange = int(math.Max(-50, math.Min(50, float64(ratingChange))))
	
	newRating := oldRating + ratingChange
	return int(math.Max(0, float64(newRating))) // Never go below 0
}

// UpdateUserRating updates user rating and rank after a match
func (rs *RatingService) UpdateUserRating(user *models.User, performanceScore int, gameMode string) (int, string, int) {
	isPlacement := !user.IsPlacementComplete
	
	newRating := rs.CalculateRatingChange(user.Rating, performanceScore, gameMode, isPlacement)
	newRank, newTier := models.GetRankFromRating(newRating)
	
	// Update placement progress
	if isPlacement {
		user.PlacementMatches++
		if user.PlacementMatches >= 5 {
			user.IsPlacementComplete = true
		}
	}
	
	user.Rating = newRating
	user.Rank = newRank
	user.RankTier = newTier
	
	return newRating, newRank, newTier
}
