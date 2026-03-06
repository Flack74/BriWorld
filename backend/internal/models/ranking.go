package models

// Rank constants
const (
	RankBronze       = "BRONZE"
	RankSilver       = "SILVER"
	RankGold         = "GOLD"
	RankPlatinum     = "PLATINUM"
	RankDiamond      = "DIAMOND"
	RankMaster       = "MASTER"
	RankGrandmaster  = "GRANDMASTER"
	RankContinental  = "CONTINENTAL"
	RankWorldClass   = "WORLD_CLASS"
	RankLegend       = "LEGEND"
)

// Rank thresholds
var RankThresholds = map[string]int{
	RankBronze:       0,
	RankSilver:       1000,
	RankGold:         1200,
	RankPlatinum:     1400,
	RankDiamond:      1600,
	RankMaster:       1800,
	RankGrandmaster:  2000,
	RankContinental:  2200,
	RankWorldClass:   2400,
	RankLegend:       2600,
}

// Mode multipliers for rating calculation
var ModeMultipliers = map[string]float64{
	"flag":         1.0,
	"map":          1.1,
	"capital":      1.0,
	"silhouette":   1.1,
	"team":         0.8,
	"relay":        0.8,
	"sabotage":     1.0,
	"territory":    1.1,
	// "audio":        1.0, // TODO: Will be added later
	"emoji":        0.9,
	"fog":          1.1,
	"journey":      1.2,
	"speed_run":    1.1,
}

// GetRankFromRating returns the rank and tier based on rating
func GetRankFromRating(rating int) (string, int) {
	rank := RankBronze
	tier := 3

	if rating >= RankThresholds[RankLegend] {
		rank = RankLegend
		tier = 1
	} else if rating >= RankThresholds[RankWorldClass] {
		rank = RankWorldClass
		tier = calculateTier(rating, RankThresholds[RankWorldClass], RankThresholds[RankLegend])
	} else if rating >= RankThresholds[RankContinental] {
		rank = RankContinental
		tier = calculateTier(rating, RankThresholds[RankContinental], RankThresholds[RankWorldClass])
	} else if rating >= RankThresholds[RankGrandmaster] {
		rank = RankGrandmaster
		tier = calculateTier(rating, RankThresholds[RankGrandmaster], RankThresholds[RankContinental])
	} else if rating >= RankThresholds[RankMaster] {
		rank = RankMaster
		tier = calculateTier(rating, RankThresholds[RankMaster], RankThresholds[RankGrandmaster])
	} else if rating >= RankThresholds[RankDiamond] {
		rank = RankDiamond
		tier = calculateTier(rating, RankThresholds[RankDiamond], RankThresholds[RankMaster])
	} else if rating >= RankThresholds[RankPlatinum] {
		rank = RankPlatinum
		tier = calculateTier(rating, RankThresholds[RankPlatinum], RankThresholds[RankDiamond])
	} else if rating >= RankThresholds[RankGold] {
		rank = RankGold
		tier = calculateTier(rating, RankThresholds[RankGold], RankThresholds[RankPlatinum])
	} else if rating >= RankThresholds[RankSilver] {
		rank = RankSilver
		tier = calculateTier(rating, RankThresholds[RankSilver], RankThresholds[RankGold])
	}

	return rank, tier
}

// calculateTier returns tier (3, 2, or 1) based on rating within rank range
func calculateTier(rating, minRating, maxRating int) int {
	rangeSize := maxRating - minRating
	tierSize := rangeSize / 3
	
	if rating >= minRating+tierSize*2 {
		return 1 // Tier I (highest)
	} else if rating >= minRating+tierSize {
		return 2 // Tier II
	}
	return 3 // Tier III (lowest)
}
