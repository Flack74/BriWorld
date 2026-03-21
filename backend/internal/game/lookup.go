// static lookup tables (ISO codes, aliases, regions)
package game

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

var countryAliases = map[string]string{
	// Modern names
	"czechia":     "czech republic",
	"ivory coast": "cote d'ivoire",
	"burma":       "myanmar",
	"swaziland":   "eswatini",
	"east timor":  "timor-leste",

	// Short forms
	"uk":    "united kingdom",
	"usa":   "united states of america",
	"us":    "united states of america",
	"uae":   "united arab emirates",
	"drc":   "democratic republic of the congo",
	"car":   "central african republic",
	"png":   "papua new guinea",
	"saudi": "saudi arabia",

	// Common variations
	"holland":       "netherlands",
	"america":       "united states of america",
	"england":       "united kingdom",
	"britain":       "united kingdom",
	"great britain": "united kingdom",
	"bharat":        "india",

	// Congo variations
	"congo-kinshasa":        "democratic republic of the congo",
	"congo kinshasa":        "democratic republic of the congo",
	"dr congo":              "democratic republic of the congo",
	"congo-brazzaville":     "congo",
	"congo brazzaville":     "congo",
	"republic of congo":     "congo",
	"republic of the congo": "congo",

	// Korea variations
	"north korea": "north korea",
	"south korea": "south korea",
	"dprk":        "north korea",
	"rok":         "south korea",
	"korea":       "south korea",

	// Saint variations
	"st kitts":                      "saint kitts and nevis",
	"st lucia":                      "saint lucia",
	"st vincent":                    "saint vincent and the grenadines",
	"st vincent and the grenadines": "saint vincent and the grenadines",

	// Other common variations
	"bosnia":    "bosnia and herzegovina",
	"trinidad":  "trinidad and tobago",
	"antigua":   "antigua and barbuda",
	"macedonia": "north macedonia",
	"timor":     "timor-leste",
}

var countryRegions = map[string]string{
	// Europe
	"GB": RegionEurope, "DE": RegionEurope, "FR": RegionEurope, "IT": RegionEurope, "ES": RegionEurope,
	"PT": RegionEurope, "NL": RegionEurope, "BE": RegionEurope, "CH": RegionEurope, "AT": RegionEurope,
	"SE": RegionEurope, "NO": RegionEurope, "DK": RegionEurope, "FI": RegionEurope, "IS": RegionEurope,
	"IE": RegionEurope, "PL": RegionEurope, "CZ": RegionEurope, "SK": RegionEurope, "HU": RegionEurope,
	"RO": RegionEurope, "BG": RegionEurope, "HR": RegionEurope, "SI": RegionEurope, "RS": RegionEurope,
	"BA": RegionEurope, "ME": RegionEurope, "MK": RegionEurope, "AL": RegionEurope, "XK": RegionEurope,
	"GR": RegionEurope, "CY": RegionEurope, "MT": RegionEurope, "LU": RegionEurope, "LI": RegionEurope,
	"MC": RegionEurope, "SM": RegionEurope, "VA": RegionEurope, "AD": RegionEurope, "EE": RegionEurope,
	"LV": RegionEurope, "LT": RegionEurope, "BY": RegionEurope, "UA": RegionEurope, "MD": RegionEurope,
	"RU": RegionEurope,

	// Asia
	"CN": RegionAsia, "JP": RegionAsia, "IN": RegionAsia, "KR": RegionAsia, "ID": RegionAsia,
	"PK": RegionAsia, "BD": RegionAsia, "VN": RegionAsia, "PH": RegionAsia, "TH": RegionAsia,
	"MY": RegionAsia, "MM": RegionAsia, "KH": RegionAsia, "LA": RegionAsia, "SG": RegionAsia,
	"BN": RegionAsia, "TL": RegionAsia, "MN": RegionAsia, "KP": RegionAsia, "TW": RegionAsia,
	"HK": RegionAsia, "MO": RegionAsia, "AF": RegionAsia, "IR": RegionAsia, "IQ": RegionAsia,
	"SY": RegionAsia, "LB": RegionAsia, "JO": RegionAsia, "IL": RegionAsia, "PS": RegionAsia,
	"SA": RegionAsia, "YE": RegionAsia, "OM": RegionAsia, "AE": RegionAsia, "QA": RegionAsia,
	"BH": RegionAsia, "KW": RegionAsia, "TR": RegionAsia, "AM": RegionAsia, "AZ": RegionAsia,
	"GE": RegionAsia, "KZ": RegionAsia, "UZ": RegionAsia, "TM": RegionAsia, "KG": RegionAsia,
	"TJ": RegionAsia, "NP": RegionAsia, "BT": RegionAsia, "LK": RegionAsia, "MV": RegionAsia,

	// Americas
	"US": RegionAmericas, "CA": RegionAmericas, "MX": RegionAmericas, "BR": RegionAmericas, "AR": RegionAmericas,
	"CL": RegionAmericas, "CO": RegionAmericas, "PE": RegionAmericas, "VE": RegionAmericas, "EC": RegionAmericas,
	"BO": RegionAmericas, "PY": RegionAmericas, "UY": RegionAmericas, "GY": RegionAmericas, "SR": RegionAmericas,
	"GF": RegionAmericas, "FK": RegionAmericas, "GT": RegionAmericas, "BZ": RegionAmericas, "HN": RegionAmericas,
	"SV": RegionAmericas, "NI": RegionAmericas, "CR": RegionAmericas, "PA": RegionAmericas, "CU": RegionAmericas,
	"JM": RegionAmericas, "HT": RegionAmericas, "DO": RegionAmericas, "PR": RegionAmericas, "TT": RegionAmericas,
	"BB": RegionAmericas, "LC": RegionAmericas, "VC": RegionAmericas, "GD": RegionAmericas, "AG": RegionAmericas,
	"DM": RegionAmericas, "KN": RegionAmericas, "BS": RegionAmericas, "TC": RegionAmericas, "KY": RegionAmericas,
	"BM": RegionAmericas, "VI": RegionAmericas, "VG": RegionAmericas, "AW": RegionAmericas, "CW": RegionAmericas,
	"SX": RegionAmericas, "BQ": RegionAmericas, "MQ": RegionAmericas, "GP": RegionAmericas, "MF": RegionAmericas,
	"BL": RegionAmericas, "AI": RegionAmericas, "MS": RegionAmericas, "PM": RegionAmericas, "GL": RegionAmericas,

	// Africa
	"EG": RegionAfrica, "NG": RegionAfrica, "ZA": RegionAfrica, "KE": RegionAfrica,
	"ET": RegionAfrica, "TZ": RegionAfrica, "UG": RegionAfrica, "GH": RegionAfrica, "CI": RegionAfrica,
	"CM": RegionAfrica, "MZ": RegionAfrica, "MG": RegionAfrica, "AO": RegionAfrica, "ZM": RegionAfrica,
	"ZW": RegionAfrica, "MW": RegionAfrica, "SN": RegionAfrica, "ML": RegionAfrica, "BF": RegionAfrica,
	"NE": RegionAfrica, "TD": RegionAfrica, "SD": RegionAfrica, "SS": RegionAfrica, "SO": RegionAfrica,
	"ER": RegionAfrica, "DJ": RegionAfrica, "RW": RegionAfrica, "BI": RegionAfrica, "MU": RegionAfrica,
	"SC": RegionAfrica, "KM": RegionAfrica, "CV": RegionAfrica, "ST": RegionAfrica, "GQ": RegionAfrica,
	"GA": RegionAfrica, "CG": RegionAfrica, "CD": RegionAfrica, "CF": RegionAfrica, "GN": RegionAfrica,
	"GW": RegionAfrica, "SL": RegionAfrica, "LR": RegionAfrica, "TG": RegionAfrica, "BJ": RegionAfrica,
	"GM": RegionAfrica, "MR": RegionAfrica, "LY": RegionAfrica, "TN": RegionAfrica, "DZ": RegionAfrica,
	"MA": RegionAfrica, "EH": RegionAfrica, "NA": RegionAfrica, "BW": RegionAfrica, "LS": RegionAfrica,
	"SZ": RegionAfrica, "RE": RegionAfrica, "YT": RegionAfrica, "IO": RegionAfrica, "SH": RegionAfrica,

	// Oceania
	"AU": RegionOceania, "NZ": RegionOceania,
	"PG": RegionOceania, "FJ": RegionOceania, "SB": RegionOceania, "VU": RegionOceania, "WS": RegionOceania,
	"TO": RegionOceania, "KI": RegionOceania, "FM": RegionOceania, "PW": RegionOceania, "MH": RegionOceania,
	"NR": RegionOceania, "TV": RegionOceania, "CK": RegionOceania, "NU": RegionOceania, "TK": RegionOceania,
	"WF": RegionOceania, "PF": RegionOceania, "NC": RegionOceania, "GU": RegionOceania, "MP": RegionOceania,
	"AS": RegionOceania, "PN": RegionOceania, "NF": RegionOceania, "CX": RegionOceania, "CC": RegionOceania,
	"HM": RegionOceania,
}

func GetSilhouetteForCountry(code string) string {
	s := Data.Silhouettes[code]

	// Skip placeholder shape
	if s == "M100,100 L150,100 L150,150 L100,150 Z" {
		return ""
	}

	return s
}
