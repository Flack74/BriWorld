package services

import (
	"context"
	"log"
	"time"

	"briworld/internal/database"
)

// LeaderboardEntry represents a player on the leaderboard
type LeaderboardEntry struct {
	Rank                 int       `json:"rank"`
	Username             string    `json:"username"`
	CountriesExplored    int       `json:"countries_explored"`
	TotalSessionTime     int       `json:"total_session_time"`
	MultiplayerSessions  int       `json:"multiplayer_sessions"`
	LongestSession       int       `json:"longest_session"`
	AverageSessionTime   int       `json:"average_session_time"`
	LastSessionTime      time.Time `json:"last_session_time"`
}

// GetFreeRoamLeaderboard retrieves top players by countries explored
func GetFreeRoamLeaderboard(limit int) ([]LeaderboardEntry, error) {
	db := database.GetDB()
	if db == nil {
		return nil, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var entries []LeaderboardEntry
	query := `
		SELECT 
			ROW_NUMBER() OVER (ORDER BY countries_explored DESC) as rank,
			username,
			COALESCE(countries_explored, 0) as countries_explored,
			COALESCE(total_session_time, 0) as total_session_time,
			COALESCE(multiplayer_sessions, 0) as multiplayer_sessions,
			COALESCE(longest_session, 0) as longest_session,
			CASE 
				WHEN (multiplayer_sessions + 1) > 0 
				THEN total_session_time / (multiplayer_sessions + 1)
				ELSE 0
			END as average_session_time,
			COALESCE(last_session_time, NOW()) as last_session_time
		FROM users
		WHERE countries_explored > 0
		ORDER BY countries_explored DESC
		LIMIT ?
	`

	if err := db.DB.WithContext(ctx).Raw(query, limit).Scan(&entries).Error; err != nil {
		log.Printf("Error fetching leaderboard: %v", err)
		return nil, err
	}

	return entries, nil
}

// GetPlayerRank retrieves a specific player's rank
func GetPlayerRank(username string) (int, error) {
	db := database.GetDB()
	if db == nil {
		return 0, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var rank int
	query := `
		SELECT COUNT(*) + 1
		FROM users
		WHERE countries_explored > (
			SELECT COALESCE(countries_explored, 0) FROM users WHERE username = ?
		)
	`

	if err := db.DB.WithContext(ctx).Raw(query, username).Scan(&rank).Error; err != nil {
		log.Printf("Error fetching player rank: %v", err)
		return 0, err
	}

	return rank, nil
}
