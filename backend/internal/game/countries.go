package game

import (
	"encoding/json"
	"log"
	"math/rand"
	"os"
)

type CountryData map[string]string

var countries CountryData
var capitals CountryData
var capitalImages map[string]string
var borders map[string][]string

// ISO 2-letter to 3-letter code mapping for borders.json
var iso2to3 = map[string]string{
	"US": "USA", "GB": "GBR", "DE": "DEU", "FR": "FRA", "IT": "ITA",
	"ES": "ESP", "PT": "PRT", "NL": "NLD", "BE": "BEL", "CH": "CHE",
	"AT": "AUT", "PL": "POL", "CZ": "CZE", "SK": "SVK", "HU": "HUN",
	"RO": "ROU", "BG": "BGR", "GR": "GRC", "TR": "TUR", "RU": "RUS",
	"UA": "UKR", "BY": "BLR", "LT": "LTU", "LV": "LVA", "EE": "EST",
	"FI": "FIN", "SE": "SWE", "NO": "NOR", "DK": "DNK", "IS": "ISL",
	"IE": "IRL", "CA": "CAN", "MX": "MEX", "BR": "BRA", "AR": "ARG",
	"CL": "CHL", "PE": "PER", "CO": "COL", "VE": "VEN", "EC": "ECU",
	"BO": "BOL", "PY": "PRY", "UY": "URY", "GY": "GUY", "SR": "SUR",
	"CN": "CHN", "JP": "JPN", "KR": "KOR", "KP": "PRK", "IN": "IND",
	"PK": "PAK", "BD": "BGD", "MM": "MMR", "TH": "THA", "VN": "VNM",
	"LA": "LAO", "KH": "KHM", "MY": "MYS", "SG": "SGP", "ID": "IDN",
	"PH": "PHL", "AU": "AUS", "NZ": "NZL", "ZA": "ZAF", "EG": "EGY",
	"NG": "NGA", "KE": "KEN", "ET": "ETH", "TZ": "TZA", "UG": "UGA",
	"DZ": "DZA", "MA": "MAR", "TN": "TUN", "LY": "LBY", "SD": "SDN",
	"AO": "AGO", "MZ": "MOZ", "ZW": "ZWE", "BW": "BWA", "NA": "NAM",
	"ZM": "ZMB", "MW": "MWI", "MG": "MDG", "CI": "CIV", "GH": "GHA",
	"SN": "SEN", "ML": "MLI", "NE": "NER", "TD": "TCD", "CM": "CMR",
	"CF": "CAF", "CG": "COG", "CD": "COD", "GA": "GAB", "GQ": "GNQ",
	"SA": "SAU", "AE": "ARE", "IQ": "IRQ", "IR": "IRN", "IL": "ISR",
	"JO": "JOR", "SY": "SYR", "LB": "LBN", "KW": "KWT", "OM": "OMN",
	"YE": "YEM", "AF": "AFG", "KZ": "KAZ", "UZ": "UZB", "TM": "TKM",
	"KG": "KGZ", "TJ": "TJK", "MN": "MNG", "NP": "NPL", "BT": "BTN",
	"LK": "LKA", "MV": "MDV", "GT": "GTM", "HN": "HND", "SV": "SLV",
	"NI": "NIC", "CR": "CRI", "PA": "PAN", "BZ": "BLZ", "CU": "CUB",
	"DO": "DOM", "HT": "HTI", "JM": "JAM", "TT": "TTO", "BS": "BHS",
	"BB": "BRB", "GD": "GRD", "LC": "LCA", "VC": "VCT", "AG": "ATG",
	"DM": "DMA", "KN": "KNA", "HR": "HRV", "SI": "SVN", "BA": "BIH",
	"RS": "SRB", "ME": "MNE", "MK": "MKD", "AL": "ALB", "XK": "KOS",
	"GE": "GEO", "AM": "ARM", "AZ": "AZE", "CY": "CYP", "MT": "MLT",
	"LU": "LUX", "LI": "LIE", "MC": "MCO", "SM": "SMR", "VA": "VAT",
	"AD": "AND", "GF": "GUF", "LS": "LSO", "SZ": "SWZ", "BJ": "BEN",
	"TG": "TGO", "BF": "BFA", "GN": "GIN", "SL": "SLE", "LR": "LBR",
	"GM": "GMB", "GW": "GNB", "MR": "MRT", "EH": "ESH", "BI": "BDI",
	"RW": "RWA", "SO": "SOM", "DJ": "DJI", "ER": "ERI", "SS": "SSD",
	"TL": "TLS", "PG": "PNG", "FJ": "FJI", "SB": "SLB", "VU": "VUT",
	"WS": "WSM", "TO": "TON", "KI": "KIR", "TV": "TUV", "NR": "NRU",
	"PW": "PLW", "MH": "MHL", "FM": "FSM",
}

func LoadCountries(filepath string) error {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(data, &countries); err != nil {
		return err
	}
	
	// Load capitals data
	capitalsPath := "static/capitals.json"
	capitalsData, err := os.ReadFile(capitalsPath)
	if err != nil {
		// Capitals are optional, log warning but don't fail
		log.Printf("Warning: Could not load capitals data: %v", err)
		return nil
	}
	if err := json.Unmarshal(capitalsData, &capitals); err != nil {
		return err
	}
	
	// Load capital images
	imagesPath := "static/capital-images.json"
	imagesData, err := os.ReadFile(imagesPath)
	if err != nil {
		log.Printf("Warning: Could not load capital images: %v", err)
		return nil
	}
	var imageMap map[string]struct {
		Capital string   `json:"capital"`
		Images  []string `json:"images"`
	}
	if err := json.Unmarshal(imagesData, &imageMap); err != nil {
		return err
	}
	
	// Extract first image URL from each country
	capitalImages = make(map[string]string)
	for code, data := range imageMap {
		if len(data.Images) > 0 {
			capitalImages[code] = data.Images[0]
		}
	}
	
	// Load borders data
	bordersPath := "static/borders.json"
	bordersData, err := os.ReadFile(bordersPath)
	if err != nil {
		log.Printf("Warning: Could not load borders data: %v", err)
		return nil
	}
	if err := json.Unmarshal(bordersData, &borders); err != nil {
		log.Printf("Warning: Could not parse borders data: %v", err)
		return nil
	}
	log.Printf("Successfully loaded %d border entries", len(borders))
	
	return nil
}

func GetRandomCountry() (code, name string) {
	keys := make([]string, 0, len(countries))
	for k := range countries {
		keys = append(keys, k)
	}
	code = keys[rand.Intn(len(keys))]
	name = countries[code]
	return
}

func GetCountryName(code string) string {
	return countries[code]
}

func GetCapital(code string) string {
	return capitals[code]
}

func GetCapitalImage(code string) string {
	return capitalImages[code]
}

func GetAllCountries() CountryData {
	return countries
}

func GetTotalCountries() int {
	return len(countries)
}

func FindCountryByName(name string) (code, countryName string) {
	// Country name aliases for common variations
	aliases := map[string]string{
		// Modern names
		"czechia": "czech republic",
		"ivory coast": "cote d'ivoire",
		"burma": "myanmar",
		"swaziland": "eswatini",
		"east timor": "timor-leste",
		
		// Short forms
		"uk": "united kingdom",
		"usa": "united states of america",
		"us": "united states of america",
		"uae": "united arab emirates",
		"drc": "democratic republic of the congo",
		"car": "central african republic",
		"png": "papua new guinea",
		
		// Common variations
		"holland": "netherlands",
		"america": "united states of america",
		"england": "united kingdom",
		"britain": "united kingdom",
		"great britain": "united kingdom",
		
		// Congo variations
		"congo-kinshasa": "democratic republic of the congo",
		"congo kinshasa": "democratic republic of the congo",
		"dr congo": "democratic republic of the congo",
		"congo-brazzaville": "congo",
		"congo brazzaville": "congo",
		"republic of congo": "congo",
		"republic of the congo": "congo",
		
		// Korea variations
		"north korea": "north korea",
		"south korea": "south korea",
		"dprk": "north korea",
		"rok": "south korea",
		"korea": "south korea",
		
		// Saint variations
		"st kitts": "saint kitts and nevis",
		"st lucia": "saint lucia",
		"st vincent": "saint vincent and the grenadines",
		"st vincent and the grenadines": "saint vincent and the grenadines",
		
		// Other common variations
		"bosnia": "bosnia and herzegovina",
		"trinidad": "trinidad and tobago",
		"antigua": "antigua and barbuda",
		"macedonia": "north macedonia",
		"timor": "timor-leste",
	}
	
	// Convert to lowercase for comparison
	lowerName := ""
	for i := 0; i < len(name); i++ {
		c := name[i]
		if c >= 'A' && c <= 'Z' {
			c += 32
		}
		lowerName += string(c)
	}
	
	// Check if there's an alias
	if alias, exists := aliases[lowerName]; exists {
		lowerName = alias
	}
	
	// Try exact match first
	for k, v := range countries {
		lowerCountry := ""
		for i := 0; i < len(v); i++ {
			c := v[i]
			if c >= 'A' && c <= 'Z' {
				c += 32
			}
			lowerCountry += string(c)
		}
		if lowerName == lowerCountry {
			return k, v
		}
	}
	return "", ""
}


// HasAnthem - TODO: Will be added later for Audio mode
// Helper function for new game modes
// func HasAnthem(code string) bool {
// 	anthemCountries := map[string]bool{
// 		"US": true, "GB": true, "FR": true, "DE": true, "IT": true,
// 		"ES": true, "RU": true, "CN": true, "JP": true, "IN": true,
// 		"BR": true, "CA": true, "AU": true, "MX": true, "KR": true,
// 	}
// 	return anthemCountries[code]
// }

func FindCapitalByName(name string) (code, capital string) {
	// Convert to lowercase for comparison
	lowerName := ""
	for i := 0; i < len(name); i++ {
		c := name[i]
		if c >= 'A' && c <= 'Z' {
			c += 32
		}
		lowerName += string(c)
	}
	
	// Try exact match
	for k, v := range capitals {
		lowerCapital := ""
		for i := 0; i < len(v); i++ {
			c := v[i]
			if c >= 'A' && c <= 'Z' {
				c += 32
			}
			lowerCapital += string(c)
		}
		if lowerName == lowerCapital {
			return k, v
		}
	}
	return "", ""
}

// GetNeighborsForCountry returns a slice of neighboring country names
// This is used for the Border Logic game mode
func GetNeighborsForCountry(code string) []string {
	// Convert 2-letter code to 3-letter code for borders.json lookup
	code3, ok := iso2to3[code]
	if !ok {
		// If no mapping exists, try using the code as-is
		code3 = code
	}
	
	log.Printf("[BORDER_LOGIC] Looking up neighbors for code=%s (3-letter=%s)", code, code3)
	
	// Get neighbor codes from borders map
	neighborCodes, exists := borders[code3]
	if !exists || len(neighborCodes) == 0 {
		log.Printf("[BORDER_LOGIC] No neighbors found for %s", code3)
		// Return empty slice for island nations or countries with no data
		return []string{}
	}
	
	log.Printf("[BORDER_LOGIC] Found %d neighbor codes: %v", len(neighborCodes), neighborCodes)
	
	// Convert 3-letter neighbor codes back to country names
	neighborNames := make([]string, 0, len(neighborCodes))
	for _, neighborCode3 := range neighborCodes {
		// Try to find the 2-letter code for this 3-letter code
		var neighborCode2 string
		for code2, code3check := range iso2to3 {
			if code3check == neighborCode3 {
				neighborCode2 = code2
				break
			}
		}
		
		// If we found a 2-letter code, get the country name
		if neighborCode2 != "" {
			if name, ok := countries[neighborCode2]; ok {
				neighborNames = append(neighborNames, name)
				log.Printf("[BORDER_LOGIC] Mapped %s -> %s -> %s", neighborCode3, neighborCode2, name)
			}
		} else {
			log.Printf("[BORDER_LOGIC] Could not find 2-letter code for %s", neighborCode3)
		}
	}
	
	log.Printf("[BORDER_LOGIC] Returning %d neighbor names: %v", len(neighborNames), neighborNames)
	return neighborNames
}

// GetRegionForCountry returns the geographic region for a country code
func GetRegionForCountry(code string) string {
regions := map[string]string{
"GB": "Europe", "DE": "Europe", "FR": "Europe", "IT": "Europe", "ES": "Europe",
"CN": "Asia", "JP": "Asia", "IN": "Asia", "KR": "Asia", "ID": "Asia",
"US": "Americas", "CA": "Americas", "MX": "Americas", "BR": "Americas", "AR": "Americas",
"EG": "Africa", "NG": "Africa", "ZA": "Africa", "KE": "Africa",
"AU": "Oceania", "NZ": "Oceania", "RU": "Europe/Asia",
}
if region, ok := regions[code]; ok {
return region
}
return "World"
}
