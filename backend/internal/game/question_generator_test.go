package game

import (
	"testing"
)

func TestGenerateQuestion(t *testing.T) {
	// Load countries data first
	if err := LoadCountries("../../static/world.json"); err != nil {
		t.Skipf("Skipping test - countries data not available: %v", err)
	}

	tests := []struct {
		name    string
		mode    string
		wantErr bool
	}{
		{"flag quiz mode", "FLAG_QUIZ", false},
		{"flag mode", "FLAG", false},
		{"capital rush mode", "CAPITAL_RUSH", false},
		{"silhouette mode", "SILHOUETTE", false},
		{"emoji mode", "EMOJI", false},
		{"border logic mode", "BORDER_LOGIC", false},
		{"world map mode", "WORLD_MAP", false},
		{"last standing mode", "LAST_STANDING", false},
		{"team battle mode", "TEAM_BATTLE", false},
		{"unknown mode defaults to flag", "UNKNOWN", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			usedCountries := make(map[string]bool)
			question, err := GenerateQuestion(tt.mode, usedCountries)

			if (err != nil) != tt.wantErr {
				t.Errorf("GenerateQuestion() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if question == nil {
					t.Error("GenerateQuestion() returned nil question")
					return
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
			}
		})
	}
}

func TestGenerateQuestionUsedCountries(t *testing.T) {
	if err := LoadCountries("../../static/world.json"); err != nil {
		t.Skipf("Skipping test - countries data not available: %v", err)
	}

	usedCountries := make(map[string]bool)

	// Generate multiple questions
	for i := 0; i < 10; i++ {
		question, err := GenerateQuestion("FLAG_QUIZ", usedCountries)
		if err != nil {
			t.Fatalf("GenerateQuestion() failed on iteration %d: %v", i, err)
		}

		// Check if country was already used
		if usedCountries[question.CountryCode] {
			t.Errorf("Country %s was used twice", question.CountryCode)
		}

		// Mark as used
		usedCountries[question.CountryCode] = true
	}

	if len(usedCountries) != 10 {
		t.Errorf("Expected 10 unique countries, got %d", len(usedCountries))
	}
}

func TestGenerateQuestionAllCountriesUsed(t *testing.T) {
	if err := LoadCountries("../../static/world.json"); err != nil {
		t.Skipf("Skipping test - countries data not available: %v", err)
	}

	usedCountries := make(map[string]bool)
	totalCountries := GetTotalCountries()

	// Mark all countries as used
	allCountries := GetAllCountries()
	for code := range allCountries {
		usedCountries[code] = true
	}

	// Try to generate question - should fail
	_, err := GenerateQuestion("FLAG_QUIZ", usedCountries)
	if err == nil {
		t.Error("GenerateQuestion() should fail when all countries are used")
	}

	if len(usedCountries) != totalCountries {
		t.Errorf("Expected %d countries, got %d", totalCountries, len(usedCountries))
	}
}

func TestGenerateQuestionTypes(t *testing.T) {
	if err := LoadCountries("../../static/world.json"); err != nil {
		t.Skipf("Skipping test - countries data not available: %v", err)
	}

	tests := []struct {
		mode         string
		expectedType string
	}{
		{"FLAG_QUIZ", "flag"},
		{"FLAG", "flag"},
		{"CAPITAL_RUSH", "capital"},
		{"SILHOUETTE", "silhouette"},
		{"EMOJI", "emoji"},
		{"BORDER_LOGIC", "border"},
		{"WORLD_MAP", "map"},
	}

	for _, tt := range tests {
		t.Run(tt.mode, func(t *testing.T) {
			question, err := GenerateQuestion(tt.mode, make(map[string]bool))
			if err != nil {
				t.Fatalf("GenerateQuestion() failed: %v", err)
			}

			if question.Type != tt.expectedType {
				t.Errorf("Question type = %s, want %s", question.Type, tt.expectedType)
			}
		})
	}
}

func TestGenerateQuestionCapitalMode(t *testing.T) {
	if err := LoadCountries("../../static/world.json"); err != nil {
		t.Skipf("Skipping test - countries data not available: %v", err)
	}

	question, err := GenerateQuestion("CAPITAL_RUSH", make(map[string]bool))
	if err != nil {
		t.Fatalf("GenerateQuestion() failed: %v", err)
	}

	if question.Capital == "" {
		t.Error("Capital question has empty capital")
	}
}

func TestGenerateQuestionBorderMode(t *testing.T) {
	if err := LoadCountries("../../static/world.json"); err != nil {
		t.Skipf("Skipping test - countries data not available: %v", err)
	}

	// Try multiple times as some countries might be islands
	var question *Question
	var err error
	for i := 0; i < 20; i++ {
		question, err = GenerateQuestion("BORDER_LOGIC", make(map[string]bool))
		if err == nil && len(question.Neighbors) > 0 {
			break
		}
	}

	if err != nil {
		t.Skipf("Could not generate border question: %v", err)
	}

	if len(question.Neighbors) == 0 {
		t.Error("Border question has no neighbors")
	}
}

func BenchmarkGenerateQuestion(b *testing.B) {
	if err := LoadCountries("../../static/world.json"); err != nil {
		b.Skipf("Skipping benchmark - countries data not available: %v", err)
	}

	usedCountries := make(map[string]bool)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		GenerateQuestion("FLAG_QUIZ", usedCountries)
	}
}
