package domain

import "math"

type RatingService struct{}

// CalculateRatingChange returns the rating change based on performance
func (rs *RatingService) CalculateRatingChange(performanceScore int, isWinner bool) int {
	baseChange := 0
	if isWinner {
		baseChange = 25 + (performanceScore / 100) // Winner gets +25 base + bonus for high score
	} else {
		baseChange = -10 // Loser gets -10
	}

	// Cap rating changes
	ratingChange := int(math.Max(-50, math.Min(50, float64(baseChange))))
	return ratingChange
}
