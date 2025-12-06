package game

var excludedCountries = map[string]bool{
	"VA": true, // Vatican City
	"MC": true, // Monaco
	"SM": true, // San Marino
	"LI": true, // Liechtenstein
	"MT": true, // Malta
	"MV": true, // Maldives
	"KN": true, // Saint Kitts and Nevis
	"MH": true, // Marshall Islands
	"LC": true, // Saint Lucia
	"SG": true, // Singapore
	"TO": true, // Tonga
	"DM": true, // Dominica
	"BB": true, // Barbados
	"ST": true, // Sao Tome and Principe
	"KI": true, // Kiribati
	"NR": true, // Nauru
	"TV": true, // Tuvalu
}

func IsCountryExcluded(code string) bool {
	return excludedCountries[code]
}
