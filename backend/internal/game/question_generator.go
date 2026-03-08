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
	for range maxAttempts {
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
	case "FLAG_QUIZ", "FLAG", "LAST_STANDING":
		question.Type = "flag"
		question.FlagCode = code

	case "SILHOUETTE":
		question.Type = "silhouette"
		question.Silhouette = GetSilhouetteForCountry(code)
		// Skip countries without valid silhouettes
		if question.Silhouette == "" {
			log.Printf("Skipping %s (%s) - no valid silhouette", name, code)
			// Mark as used to avoid infinite loop
			usedCountries[code] = true
			return GenerateQuestion(mode, usedCountries)
		}
		// Generate 4 randomized answer options
		question.Options = GenerateAnswerOptions(code, 4)

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
