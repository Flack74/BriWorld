package game

// GetEmojiForCountry returns emoji string for a country
func GetEmojiForCountry(code string) string {
	if emoji, ok := EmojiMap[code]; ok {
		return emoji
	}
	return "🌍🗺️🌎"
}

// GetHintForCountry returns hint for a country
func GetHintForCountry(code string) string {
	if hint, ok := CountryHints[code]; ok {
		return hint
	}
	return ""
}
