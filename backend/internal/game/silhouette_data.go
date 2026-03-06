package game

import (
	"encoding/json"
	"log"
	"os"
)

var SilhouetteMap map[string]string

func init() {
	SilhouetteMap = make(map[string]string)
	data, err := os.ReadFile("static/silhouettes.json")
	if err != nil {
		log.Printf("Warning: Failed to load silhouettes.json: %v", err)
		return
	}
	if err := json.Unmarshal(data, &SilhouetteMap); err != nil {
		log.Printf("Warning: Failed to parse silhouettes.json: %v", err)
	}
}

func GetSilhouetteForCountry(countryCode string) string {
	if silhouette, ok := SilhouetteMap[countryCode]; ok {
		return silhouette
	}
	return "M100,100 L150,100 L150,150 L100,150 Z"
}
