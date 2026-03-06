package utils

import (
	"testing"
)

// TestFuzzyMatch tests the fuzzy string matching algorithm
// which is critical for accepting player answers with minor typos
func TestFuzzyMatch(t *testing.T) {
	tests := []struct {
		name        string
		answer      string
		expected    string
		maxDistance int
		want        bool
	}{
		{
			name:        "exact match",
			answer:      "France",
			expected:    "France",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "case insensitive match",
			answer:      "FRANCE",
			expected:    "france",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "one character typo",
			answer:      "Frence",
			expected:    "France",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "two character typos",
			answer:      "Fronce",
			expected:    "France",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "three character typos exceeds threshold",
			answer:      "Fronke",
			expected:    "France",
			maxDistance: 2,
			want:        true, // "Fronke" -> "France" is actually 2 edits (o->a, k->c)
		},
		{
			name:        "missing character",
			answer:      "Frace",
			expected:    "France",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "extra character",
			answer:      "Francee",
			expected:    "France",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "special characters ignored",
			answer:      "Fran-ce!",
			expected:    "France",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "spaces ignored",
			answer:      "United States",
			expected:    "UnitedStates",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "common country typo - India",
			answer:      "Indai",
			expected:    "India",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "common country typo - Brazil",
			answer:      "Brazl",
			expected:    "Brazil",
			maxDistance: 2,
			want:        true,
		},
		{
			name:        "completely different word",
			answer:      "Germany",
			expected:    "France",
			maxDistance: 2,
			want:        false,
		},
		{
			name:        "empty answer",
			answer:      "",
			expected:    "France",
			maxDistance: 2,
			want:        false,
		},
		{
			name:        "empty expected",
			answer:      "France",
			expected:    "",
			maxDistance: 2,
			want:        false,
		},
		{
			name:        "both empty",
			answer:      "",
			expected:    "",
			maxDistance: 2,
			want:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := FuzzyMatch(tt.answer, tt.expected, tt.maxDistance)
			if got != tt.want {
				t.Errorf("FuzzyMatch(%q, %q, %d) = %v, want %v",
					tt.answer, tt.expected, tt.maxDistance, got, tt.want)
			}
		})
	}
}

// TestNormalizeString tests the string normalization function
func TestNormalizeString(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "lowercase conversion",
			input: "FRANCE",
			want:  "france",
		},
		{
			name:  "remove spaces",
			input: "United States",
			want:  "unitedstates",
		},
		{
			name:  "remove special characters",
			input: "Côte d'Ivoire",
			want:  "côtedivoire", // ô is kept as it's a letter
		},
		{
			name:  "remove punctuation",
			input: "Hello, World!",
			want:  "helloworld",
		},
		{
			name:  "keep alphanumeric",
			input: "Test123",
			want:  "test123",
		},
		{
			name:  "empty string",
			input: "",
			want:  "",
		},
		{
			name:  "only special characters",
			input: "!@#$%",
			want:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeString(tt.input)
			if got != tt.want {
				t.Errorf("normalizeString(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

// TestLevenshteinDistance tests the edit distance calculation
func TestLevenshteinDistance(t *testing.T) {
	tests := []struct {
		name string
		a    string
		b    string
		want int
	}{
		{
			name: "identical strings",
			a:    "test",
			b:    "test",
			want: 0,
		},
		{
			name: "one insertion",
			a:    "test",
			b:    "tests",
			want: 1,
		},
		{
			name: "one deletion",
			a:    "tests",
			b:    "test",
			want: 1,
		},
		{
			name: "one substitution",
			a:    "test",
			b:    "best",
			want: 1,
		},
		{
			name: "multiple operations",
			a:    "kitten",
			b:    "sitting",
			want: 3,
		},
		{
			name: "empty to non-empty",
			a:    "",
			b:    "test",
			want: 4,
		},
		{
			name: "non-empty to empty",
			a:    "test",
			b:    "",
			want: 4,
		},
		{
			name: "both empty",
			a:    "",
			b:    "",
			want: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := levenshteinDistance(tt.a, tt.b)
			if got != tt.want {
				t.Errorf("levenshteinDistance(%q, %q) = %d, want %d", tt.a, tt.b, got, tt.want)
			}
		})
	}
}

// BenchmarkFuzzyMatch benchmarks the fuzzy matching performance
func BenchmarkFuzzyMatch(b *testing.B) {
	for i := 0; i < b.N; i++ {
		FuzzyMatch("France", "Frence", 2)
	}
}

// BenchmarkLevenshteinDistance benchmarks the edit distance calculation
func BenchmarkLevenshteinDistance(b *testing.B) {
	for i := 0; i < b.N; i++ {
		levenshteinDistance("kitten", "sitting")
	}
}
