package game

import (
	"testing"
)

func setupGameData(t *testing.T) {
	t.Helper()

	if err := LoadStaticData(); err != nil {
		t.Skipf("Skipping test - static data not available: %v", err)
	}
}

func TestGenerateQuestion(t *testing.T) {
	setupGameData(t)

	tests := []struct {
		name    string
		mode    string
		wantErr bool
	}{
		{"flag quiz mode", "FLAG_QUIZ", false},
		{"flag mode", "FLAG", false},
		{"silhouette mode", "SILHOUETTE", false},
		{"emoji mode", "EMOJI", false},
		{"border logic mode", "BORDER_LOGIC", false},
		{"world map mode", "WORLD_MAP", false},
		{"last standing mode", "LAST_STANDING", false},
		{"unknown mode defaults to flag", "UNKNOWN", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			usedCountries := make(map[string]bool)

			question, err := Data.GenerateQuestion(tt.mode, usedCountries)

			if (err != nil) != tt.wantErr {
				t.Fatalf("GenerateQuestion() error = %v, wantErr %v", err, tt.wantErr)
			}

			if question == nil {
				t.Fatal("GenerateQuestion() returned nil question")
			}

			if question.CountryCode == "" {
				t.Error("Question has empty country code")
			}

			if question.CountryName == "" {
				t.Error("Question has empty country name")
			}

			if question.Type == "" {
				t.Error("Question has empty type")
			}
		})
	}
}

func TestGenerateQuestionUsedCountries(t *testing.T) {
	setupGameData(t)

	usedCountries := make(map[string]bool)

	for i := 0; i < 10; i++ {

		q, err := Data.GenerateQuestion("FLAG_QUIZ", usedCountries)
		if err != nil {
			t.Fatalf("GenerateQuestion failed: %v", err)
		}

		if usedCountries[q.CountryCode] {
			t.Fatalf("Country %s was reused", q.CountryCode)
		}

		usedCountries[q.CountryCode] = true
	}

	if len(usedCountries) != 10 {
		t.Fatalf("Expected 10 unique countries, got %d", len(usedCountries))
	}
}

func TestGenerateQuestionAllCountriesUsed(t *testing.T) {
	setupGameData(t)

	usedCountries := make(map[string]bool)

	for code := range Data.Countries {
		usedCountries[code] = true
	}

	_, err := Data.GenerateQuestion("FLAG_QUIZ", usedCountries)

	if err == nil {
		t.Fatal("Expected error when all countries used")
	}
}

func TestGenerateQuestionTypes(t *testing.T) {
	setupGameData(t)

	tests := []struct {
		mode         string
		expectedType string
	}{
		{"FLAG_QUIZ", "flag"},
		{"FLAG", "flag"},
		{"SILHOUETTE", "silhouette"},
		{"EMOJI", "emoji"},
		{"BORDER_LOGIC", "border"},
		{"WORLD_MAP", "map"},
	}

	for _, tt := range tests {

		t.Run(tt.mode, func(t *testing.T) {

			q, err := Data.GenerateQuestion(tt.mode, make(map[string]bool))
			if err != nil {
				t.Fatalf("GenerateQuestion failed: %v", err)
			}

			if q.Type != tt.expectedType {
				t.Fatalf("Expected type %s got %s", tt.expectedType, q.Type)
			}

		})
	}
}

func TestGenerateQuestionBorderMode(t *testing.T) {
	setupGameData(t)

	var q *Question
	var err error

	for range 20 {

		q, err = Data.GenerateQuestion("BORDER_LOGIC", make(map[string]bool))

		if err == nil && len(q.Neighbors) > 0 {
			break
		}
	}

	if err != nil {
		t.Skipf("Could not generate border question: %v", err)
	}

	if len(q.Neighbors) == 0 {
		t.Fatal("Border question has no neighbors")
	}
}

func BenchmarkGenerateQuestion(b *testing.B) {

	if err := LoadStaticData(); err != nil {
		b.Skip("Static data not available")
	}

	usedCountries := make(map[string]bool)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		Data.GenerateQuestion("FLAG_QUIZ", usedCountries)
	}
}
