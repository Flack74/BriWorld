package game

// GameMode represents a valid game mode identifier
type GameMode string

const (
	ModeFlag         GameMode = "FLAG"
	ModeWorldMap     GameMode = "WORLD_MAP"
	ModeSilhouette   GameMode = "SILHOUETTE"
	ModeEmoji        GameMode = "EMOJI"
	ModeLastStanding GameMode = "LAST_STANDING"
	ModeBorderLogic  GameMode = "BORDER_LOGIC"
)

// QuestionType represents the type of question for a mode
type QuestionType string

const (
	QuestionFlagGuess       QuestionType = "FLAG_GUESS"
	QuestionMapGuess        QuestionType = "MAP_GUESS"
	QuestionSilhouetteGuess QuestionType = "SILHOUETTE_GUESS"
	QuestionEmojiGuess      QuestionType = "EMOJI_GUESS"
	QuestionBorderGuess     QuestionType = "BORDER_GUESS"
)
