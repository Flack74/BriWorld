package game

import (
	"errors"
	"log"
)

// GenerateQuestion creates a question for the given game mode.
// It selects a random country that hasn't been used yet.
func GenerateQuestion(mode string, usedCountries map[string]bool) (*Question, error) {
	// Check if we've used all countries
	if len(usedCountries) >= len(countries) {
		return nil, errors.New("all countries have been used")
	}

	// Get a random unused country
	var code, name string
	maxAttempts := 100
	for i := 0; i < maxAttempts; i++ {
		code, name = GetRandomCountry()
		if !usedCountries[code] {
			break
		}
	}

	if usedCountries[code] {
		return nil, errors.New("could not find unused country")
	}

	// Create question based on mode
	question := &Question{
		CountryCode: code,
		CountryName: name,
		TimeLimit:   GetDefaultTimeout(mode),
	}

	switch mode {
	case "FLAG_QUIZ", "FLAG", "LAST_STANDING", "TEAM_BATTLE":
		question.Type = "flag"
		question.FlagCode = code

	case "CAPITAL_RUSH":
		question.Type = "capital"
		question.Capital = GetCapital(code)
		if question.Capital == "" {
			log.Printf("Warning: No capital found for %s", name)
			question.Capital = "Unknown"
		}

	case "SILHOUETTE":
		question.Type = "silhouette"
		question.Silhouette = GetSilhouetteForCountry(code)
		// Skip countries without valid silhouettes (placeholder shape)
		if question.Silhouette == "" || question.Silhouette == "M100,100 L150,100 L150,150 L100,150 Z" {
			log.Printf("Skipping %s - no valid silhouette", name)
			return GenerateQuestion(mode, usedCountries)
		}

	case "EMOJI":
		question.Type = "emoji"
		question.Emoji = GetEmojiForCountry(code)

	case "BORDER_LOGIC":
		question.Type = "border"
		question.Neighbors = GetNeighborsForCountry(code)
		if len(question.Neighbors) == 0 {
			// Skip island nations, try again
			return GenerateQuestion(mode, usedCountries)
		}

	case "WORLD_MAP":
		question.Type = "map"
		question.FlagCode = code

	default:
		question.Type = "flag"
		question.FlagCode = code
	}

	return question, nil
}
