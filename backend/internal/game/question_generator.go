package game

import (
	"errors"
)

func (g *GameData) GenerateQuestion(mode string, usedCountries map[string]bool) (*Question, error) {

	if len(usedCountries) >= g.GetTotalCountries() {
		return nil, errors.New("all countries have been used")
	}

	const maxAttempts = 100

	for i := 0; i < maxAttempts; i++ {

		code, name := g.GetRandomCountry()

		if usedCountries[code] {
			continue
		}

		q := &Question{
			CountryCode: code,
			CountryName: name,
			TimeLimit:   GetDefaultTimeout(mode),
		}

		switch mode {

		case "FLAG_QUIZ", "FLAG", "LAST_STANDING":
			q.Type = "flag"
			q.FlagCode = code

		case "SILHOUETTE":
			s := GetSilhouetteForCountry(code)
			if s == "" {
				continue
			}

			q.Type = "silhouette"
			q.Silhouette = s
			q.Options = g.GenerateAnswerOptions(code, 4)

		case "EMOJI":
			q.Type = "emoji"
			q.Emoji = GetEmojiForCountry(code)

		case "BORDER_LOGIC":
			neighbors := g.GetNeighborsForCountry(code)
			if len(neighbors) == 0 {
				continue
			}

			q.Type = "border"
			q.Neighbors = neighbors

		case "WORLD_MAP":
			q.Type = "map"
			q.FlagCode = code

		default:
			q.Type = "flag"
			q.FlagCode = code
		}

		return q, nil
	}

	return nil, errors.New("failed to generate question")
}
