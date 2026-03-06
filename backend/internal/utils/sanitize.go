package utils

import (
	"html"
	"strings"
)

func SanitizeInput(input string) string {
	input = strings.TrimSpace(input)
	input = html.EscapeString(input)
	return input
}
