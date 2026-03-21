package game

// ModeConfig holds metadata for each game mode
type ModeConfig struct {
	IsTimed          bool
	DefaultTimeout   int
	QuestionType     QuestionType
	MinPlayers       int
	IsTeamMode       bool
	RequiresMap      bool
	IsExploration    bool
	SupportsMultiple bool
}

// modeConfigs is the single source of truth
var modeConfigs = map[GameMode]ModeConfig{
	ModeFlag: {
		IsTimed:          true,
		DefaultTimeout:   15,
		QuestionType:     QuestionFlagGuess,
		MinPlayers:       1,
		SupportsMultiple: true,
	},

	ModeWorldMap: {
		IsTimed:          false,
		DefaultTimeout:   0,
		QuestionType:     QuestionMapGuess,
		MinPlayers:       1,
		RequiresMap:      true,
		SupportsMultiple: true,
	},

	ModeSilhouette: {
		IsTimed:          true,
		DefaultTimeout:   15,
		QuestionType:     QuestionSilhouetteGuess,
		MinPlayers:       1,
		SupportsMultiple: true,
	},

	ModeEmoji: {
		IsTimed:          true,
		DefaultTimeout:   15,
		QuestionType:     QuestionEmojiGuess,
		MinPlayers:       1,
		SupportsMultiple: true,
	},

	ModeLastStanding: {
		IsTimed:          true,
		DefaultTimeout:   15,
		QuestionType:     QuestionFlagGuess,
		MinPlayers:       1,
		SupportsMultiple: true,
	},

	ModeBorderLogic: {
		IsTimed:          true,
		DefaultTimeout:   20,
		QuestionType:     QuestionBorderGuess,
		MinPlayers:       1,
		SupportsMultiple: true,
	},
}
