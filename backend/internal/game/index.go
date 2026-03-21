// runtime indexes
package game

import (
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

func normalizeCountryName(name string) string {
	decomposed := norm.NFD.String(strings.ToLower(strings.TrimSpace(name)))
	var b strings.Builder
	b.Grow(len(decomposed))

	lastWasSpace := false
	for _, r := range decomposed {
		switch {
		case unicode.Is(unicode.Mn, r):
			continue
		case unicode.IsLetter(r) || unicode.IsNumber(r):
			b.WriteRune(r)
			lastWasSpace = false
		default:
			if !lastWasSpace {
				b.WriteByte(' ')
				lastWasSpace = true
			}
		}
	}

	return strings.TrimSpace(b.String())
}

func buildIndexes() {
	Data.CountryKeys = make([]string, 0, len(Data.Countries))
	Data.CountryNameIndex = make(map[string]string, len(Data.Countries))

	for code, name := range Data.Countries {
		normalized := normalizeCountryName(name)

		Data.CountryKeys = append(Data.CountryKeys, code)
		Data.CountryNameIndex[normalized] = code
	}

	for alias, real := range countryAliases {
		if code, ok := Data.CountryNameIndex[normalizeCountryName(real)]; ok {
			Data.CountryNameIndex[normalizeCountryName(alias)] = code
		}
	}

	buildISOReverseIndex()
}

func buildISOReverseIndex() {
	iso3to2 = make(map[string]string, len(iso2to3))

	for code2, code3 := range iso2to3 {
		iso3to2[code3] = code2
	}
}
