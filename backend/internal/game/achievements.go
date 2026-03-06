package game

import "time"

// Achievement represents a player achievement
type Achievement struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Threshold   int    `json:"threshold"`
	Type        string `json:"type"` // countries_explored, session_time, multiplayer_sessions
	UnlockedAt  int64  `json:"unlocked_at,omitempty"`
}

// AchievementTracker tracks player achievements
type AchievementTracker struct {
	Achievements map[string]*Achievement `json:"achievements"`
	Progress     map[string]int          `json:"progress"`
}

// GetAchievements returns all available achievements
func GetAchievements() map[string]*Achievement {
	return map[string]*Achievement{
		"explorer_10": {
			ID:          "explorer_10",
			Name:        "Explorer",
			Description: "Explore 10 countries",
			Icon:        "🌍",
			Threshold:   10,
			Type:        "countries_explored",
		},
		"explorer_50": {
			ID:          "explorer_50",
			Name:        "World Traveler",
			Description: "Explore 50 countries",
			Icon:        "✈️",
			Threshold:   50,
			Type:        "countries_explored",
		},
		"explorer_100": {
			ID:          "explorer_100",
			Name:        "Globetrotter",
			Description: "Explore 100 countries",
			Icon:        "🌐",
			Threshold:   100,
			Type:        "countries_explored",
		},
		"explorer_170": {
			ID:          "explorer_170",
			Name:        "World Master",
			Description: "Explore all 170 countries",
			Icon:        "👑",
			Threshold:   170,
			Type:        "countries_explored",
		},
		"session_300": {
			ID:          "session_300",
			Name:        "Patient Explorer",
			Description: "Explore for 5 minutes",
			Icon:        "⏱️",
			Threshold:   300,
			Type:        "session_time",
		},
		"multiplayer_5": {
			ID:          "multiplayer_5",
			Name:        "Social Explorer",
			Description: "Complete 5 multiplayer sessions",
			Icon:        "👥",
			Threshold:   5,
			Type:        "multiplayer_sessions",
		},
	}
}

// CheckAchievements checks if player unlocked any achievements
func CheckAchievements(tracker *AchievementTracker, countriesExplored int, sessionTime int, multiplayerSessions int) []string {
	unlocked := []string{}
	achievements := GetAchievements()

	for id, achievement := range achievements {
		if tracker.Achievements[id] != nil {
			continue // Already unlocked
		}

		var progress int
		switch achievement.Type {
		case "countries_explored":
			progress = countriesExplored
		case "session_time":
			progress = sessionTime
		case "multiplayer_sessions":
			progress = multiplayerSessions
		}

		if progress >= achievement.Threshold {
			tracker.Achievements[id] = achievement
			tracker.Achievements[id].UnlockedAt = int64(time.Now().Unix())
			unlocked = append(unlocked, id)
		}

		tracker.Progress[id] = progress
	}

	return unlocked
}
