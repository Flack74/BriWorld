package game

import (
	"encoding/json"
	"log"
	"os"
)

// SilhouetteHint represents progressive hints for silhouette mode
type SilhouetteHint struct {
	Region    string `json:"region"`     // Continent/region
	Neighbors int    `json:"neighbors"`  // Number of bordering countries
	FirstLetter string `json:"first_letter"` // First letter of country name
}

// GetSilhouetteHints returns progressive hints for a country
func GetSilhouetteHints(countryCode string) *SilhouetteHint {
	countryName := countries[countryCode]
	if countryName == "" {
		return nil
	}

	// Determine region based on country code patterns
	region := getRegion(countryCode)
	
	// Get neighbor count from borders data
	neighborCount := getNeighborCount(countryCode)
	
	// Get first letter
	firstLetter := ""
	if len(countryName) > 0 {
		firstLetter = string(countryName[0])
	}

	return &SilhouetteHint{
		Region:      region,
		Neighbors:   neighborCount,
		FirstLetter: firstLetter,
	}
}

// getRegion determines the continent/region for a country
func getRegion(code string) string {
	// Africa
	africaCodes := map[string]bool{
		"DZ": true, "AO": true, "BJ": true, "BW": true, "BF": true, "BI": true,
		"CM": true, "CV": true, "CF": true, "TD": true, "KM": true, "CG": true,
		"CD": true, "CI": true, "DJ": true, "EG": true, "GQ": true, "ER": true,
		"ET": true, "GA": true, "GM": true, "GH": true, "GN": true, "GW": true,
		"KE": true, "LS": true, "LR": true, "LY": true, "MG": true, "MW": true,
		"ML": true, "MR": true, "MU": true, "YT": true, "MA": true, "MZ": true,
		"NA": true, "NE": true, "NG": true, "RE": true, "RW": true, "SH": true,
		"ST": true, "SN": true, "SC": true, "SL": true, "SO": true, "ZA": true,
		"SS": true, "SD": true, "SZ": true, "TZ": true, "TG": true, "TN": true,
		"UG": true, "ZM": true, "ZW": true,
	}

	// Europe
	europeCodes := map[string]bool{
		"AL": true, "AD": true, "AT": true, "BY": true, "BE": true, "BA": true,
		"BG": true, "HR": true, "CY": true, "CZ": true, "DK": true, "EE": true,
		"FO": true, "FI": true, "FR": true, "DE": true, "GI": true, "GR": true,
		"GG": true, "HU": true, "IS": true, "IE": true, "IM": true, "IT": true,
		"JE": true, "XK": true, "LV": true, "LI": true, "LT": true, "LU": true,
		"MK": true, "MT": true, "MD": true, "MC": true, "ME": true, "NL": true,
		"NO": true, "PL": true, "PT": true, "RO": true, "RU": true, "SM": true,
		"RS": true, "SK": true, "SI": true, "ES": true, "SJ": true, "SE": true,
		"CH": true, "UA": true, "GB": true, "VA": true, "AX": true,
	}

	// Asia
	asiaCodes := map[string]bool{
		"AF": true, "AM": true, "AZ": true, "BH": true, "BD": true, "BT": true,
		"BN": true, "KH": true, "CN": true, "GE": true, "HK": true, "IN": true,
		"ID": true, "IR": true, "IQ": true, "IL": true, "JP": true, "JO": true,
		"KZ": true, "KW": true, "KG": true, "LA": true, "LB": true, "MO": true,
		"MY": true, "MV": true, "MN": true, "MM": true, "NP": true, "KP": true,
		"OM": true, "PK": true, "PS": true, "PH": true, "QA": true, "SA": true,
		"SG": true, "KR": true, "LK": true, "SY": true, "TW": true, "TJ": true,
		"TH": true, "TL": true, "TR": true, "TM": true, "AE": true, "UZ": true,
		"VN": true, "YE": true,
	}

	// North America
	northAmericaCodes := map[string]bool{
		"AI": true, "AG": true, "AW": true, "BS": true, "BB": true, "BZ": true,
		"BM": true, "BQ": true, "CA": true, "KY": true, "CR": true, "CU": true,
		"CW": true, "DM": true, "DO": true, "SV": true, "GL": true, "GD": true,
		"GP": true, "GT": true, "HT": true, "HN": true, "JM": true, "MQ": true,
		"MX": true, "MS": true, "NI": true, "PA": true, "PM": true, "PR": true,
		"BL": true, "KN": true, "LC": true, "MF": true, "VC": true, "SX": true,
		"TT": true, "TC": true, "US": true, "VG": true, "VI": true,
	}

	// South America
	southAmericaCodes := map[string]bool{
		"AR": true, "BO": true, "BR": true, "CL": true, "CO": true, "EC": true,
		"FK": true, "GF": true, "GY": true, "PY": true, "PE": true, "SR": true,
		"UY": true, "VE": true,
	}

	// Oceania
	oceaniaCodes := map[string]bool{
		"AS": true, "AU": true, "CK": true, "FJ": true, "PF": true, "GU": true,
		"KI": true, "MH": true, "FM": true, "NR": true, "NC": true, "NZ": true,
		"NU": true, "NF": true, "MP": true, "PW": true, "PG": true, "PN": true,
		"WS": true, "SB": true, "TK": true, "TO": true, "TV": true, "VU": true,
		"WF": true,
	}

	if africaCodes[code] {
		return "Africa"
	}
	if europeCodes[code] {
		return "Europe"
	}
	if asiaCodes[code] {
		return "Asia"
	}
	if northAmericaCodes[code] {
		return "North America"
	}
	if southAmericaCodes[code] {
		return "South America"
	}
	if oceaniaCodes[code] {
		return "Oceania"
	}

	return "Unknown"
}

// getNeighborCount returns the number of bordering countries
func getNeighborCount(code string) int {
	// Load borders data
	var borders map[string][]string
	data, err := os.ReadFile("static/borders.json")
	if err != nil {
		log.Printf("Failed to load borders for hint: %v", err)
		return 0
	}
	if err := json.Unmarshal(data, &borders); err != nil {
		log.Printf("Failed to parse borders for hint: %v", err)
		return 0
	}

	if neighborList, exists := borders[code]; exists {
		return len(neighborList)
	}
	return 0
}
