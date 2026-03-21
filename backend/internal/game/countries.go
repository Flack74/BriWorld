// gameplay logic for countries
package game

import (
	"strings"
)

func (g *GameData) GetRandomCountry() (code, name string) {
	if len(g.CountryKeys) == 0 {
		return "", ""
	}

	code = g.CountryKeys[g.Rng.Intn(len(g.CountryKeys))]
	name = g.Countries[code]
	return
}

func (g *GameData) GetCountryName(code string) string {
	return g.Countries[code]
}

func (g *GameData) GetAllCountries() CountryData {
	return g.Countries
}

func (g *GameData) GetTotalCountries() int {
	return len(g.Countries)
}

func (g *GameData) FindCountryByName(name string) (code, countryName string) {
	code, ok := g.CountryNameIndex[strings.ToLower(name)]
	if !ok {
		return "", ""
	}

	return code, g.Countries[code]
}

// GetNeighborsForCountry returns a slice of neighboring country names
// This is used for the Border Logic game mode
func (g *GameData) GetNeighborsForCountry(code string) []string {
	// Convert 2-letter code to 3-letter code for borders.json lookup
	code3, ok := iso2to3[code]
	if !ok {
		code3 = code
	}

	// Get neighbor codes from borders map
	neighborCodes := g.Borders[code3]
	if len(neighborCodes) == 0 {
		return nil
	}

	neighborNames := make([]string, 0, len(neighborCodes))

	for _, neighborCode3 := range neighborCodes {
		if code2 := iso3to2[neighborCode3]; code2 != "" {
			if name, ok := g.Countries[code2]; ok {
				neighborNames = append(neighborNames, name)
			}
		}
	}
	return neighborNames
}

// GetRegionForCountry returns the geographic region for a country code
func GetRegionForCountry(code string) string {
	if region, ok := countryRegions[code]; ok {
		return region
	}
	return "World"
}

// GenerateAnswerOptions creates randomized multiple-choice options
// pick ~3 random entries and shuffle 4 items
func (g *GameData) GenerateAnswerOptions(correctCode string, count int) []string {
	if count < 2 {
		count = 4
	}

	correctName, ok := g.Countries[correctCode]
	if !ok {
		return nil
	}

	options := make([]string, 0, count)
	used := map[string]struct{}{
		correctCode: {},
	}

	// Pick wrong answers
	for len(options) < count-1 {
		c := g.CountryKeys[g.Rng.Intn(len(g.CountryKeys))]

		if _, exists := used[c]; exists {
			continue
		}

		used[c] = struct{}{}
		options = append(options, g.Countries[c])
	}

	// Add correct answer
	options = append(options, correctName)

	// Shuffle final options
	g.Rng.Shuffle(len(options), func(i, j int) {
		options[i], options[j] = options[j], options[i]
	})

	return options
}
