// GameData struct + global instance
package game

import "math/rand"

type CountryData map[string]string

type GameData struct {
	Countries        CountryData
	Borders          map[string][]string
	Silhouettes      map[string]string
	CountryKeys      []string
	CountryNameIndex map[string]string
	Rng              *rand.Rand
}

const (
	RegionEurope   = "Europe"
	RegionAsia     = "Asia"
	RegionAmericas = "Americas"
	RegionAfrica   = "Africa"
	RegionOceania  = "Oceania"
)

var Data = &GameData{}

var iso3to2 map[string]string
