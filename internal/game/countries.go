package game

import (
	"encoding/json"
	"math/rand"
	"os"
)

type CountryData map[string]string

var countries CountryData

func LoadCountries(filepath string) error {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &countries)
}

func GetRandomCountry() (code, name string) {
	keys := make([]string, 0, len(countries))
	for k := range countries {
		if !IsCountryExcluded(k) {
			keys = append(keys, k)
		}
	}
	code = keys[rand.Intn(len(keys))]
	name = countries[code]
	return
}

func GetCountryName(code string) string {
	return countries[code]
}

func GetAllCountries() CountryData {
	return countries
}
