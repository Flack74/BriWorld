package utils

import (
	"unicode/utf8"
)

// splitEmojis splits packed emoji strings into individual emojis.
func SplitEmojis(s string) []string {
	var result []string
	runes := []rune(s)
	i := 0

	for i < len(runes) {
		if !utf8.ValidRune(runes[i]) {
			i++
			continue
		}

		emoji := string(runes[i])
		i++

		for i < len(runes) {
			next := runes[i]

			switch {
			case next == 0xFE0F,
				next == 0x20E3,
				next == 0x200D,
				next >= 0x1F3FB && next <= 0x1F3FF,
				next >= 0x1F1E0 && next <= 0x1F1FF,
				next >= 0xE0000 && next <= 0xE007F:

				emoji += string(next)
				i++

			default:
				goto done
			}
		}

	done:
		result = append(result, emoji)
	}

	return result
}
