package game

import "testing"

func TestFindCountryByNameNormalizesCommonVariants(t *testing.T) {
	Data.Countries = CountryData{
		"US": "United States of America",
		"CV": "Cabo Verde",
		"CI": "Côte d'Ivoire",
		"VA": "Vatican City",
		"ST": "Sao Tome and Principe",
	}
	buildIndexes()

	tests := map[string]string{
		"United States": "US",
		"usa":           "US",
		"Cape Verde":    "CV",
		"Cote d Ivoire": "CI",
		"Côte d'Ivoire": "CI",
		"Vatican":       "VA",
		"Sao Tome":      "ST",
	}

	for input, want := range tests {
		got, _ := Data.FindCountryByName(input)
		if got != want {
			t.Fatalf("FindCountryByName(%q) = %q, want %q", input, got, want)
		}
	}
}
