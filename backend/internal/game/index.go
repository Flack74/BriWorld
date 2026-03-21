// runtime indexes
package game

import "strings"

func buildIndexes() {
	Data.CountryKeys = make([]string, 0, len(Data.Countries))
	Data.CountryNameIndex = make(map[string]string, len(Data.Countries))

	for code, name := range Data.Countries {
		lower := strings.ToLower(name)

		Data.CountryKeys = append(Data.CountryKeys, code)
		Data.CountryNameIndex[lower] = code
	}

	for alias, real := range countryAliases {
		if code, ok := Data.CountryNameIndex[real]; ok {
			Data.CountryNameIndex[alias] = code
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
