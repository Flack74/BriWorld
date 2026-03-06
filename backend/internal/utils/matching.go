package utils

import (
	"strings"
	"unicode"
)

func FuzzyMatch(answer, expected string, maxDistance int) bool {
	answer = normalizeString(answer)
	expected = normalizeString(expected)

	if answer == expected {
		return true
	}

	distance := levenshteinDistance(answer, expected)
	return distance <= maxDistance
}

func normalizeString(s string) string {
	s = strings.ToLower(s)
	var result strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			result.WriteRune(r)
		}
	}
	return result.String()
}

func levenshteinDistance(a, b string) int {
	if len(a) == 0 {
		return len(b)
	}
	if len(b) == 0 {
		return len(a)
	}

	dp := make([][]int, len(a)+1)
	for i := range dp {
		dp[i] = make([]int, len(b)+1)
		dp[i][0] = i
	}
	for j := range dp[0] {
		dp[0][j] = j
	}

	for i := 1; i <= len(a); i++ {
		for j := 1; j <= len(b); j++ {
			cost := 0
			if a[i-1] != b[j-1] {
				cost = 1
			}
			dp[i][j] = min(dp[i-1][j]+1, min(dp[i][j-1]+1, dp[i-1][j-1]+cost))
		}
	}

	return dp[len(a)][len(b)]
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
