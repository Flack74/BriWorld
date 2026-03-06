package game

// GameMode represents a valid game mode identifier
type GameMode string

// Game mode constants - exhaustive list of all supported modes
const (
	ModeFlag         GameMode = "FLAG"
	ModeWorldMap     GameMode = "WORLD_MAP"
	// ModeCapitalRush  GameMode = "CAPITAL_RUSH" // TODO: Will be added later
	ModeSilhouette   GameMode = "SILHOUETTE"
	ModeEmoji        GameMode = "EMOJI"
	// ModeTeamBattle   GameMode = "TEAM_BATTLE" // TODO: Will be added later
	ModeLastStanding GameMode = "LAST_STANDING"
	ModeBorderLogic  GameMode = "BORDER_LOGIC"
	// ModeAudio        GameMode = "AUDIO" // TODO: Will be added later
)

// QuestionType represents the type of question for a mode
type QuestionType string

const (
	QuestionFlagGuess       QuestionType = "FLAG_GUESS"
	QuestionMapGuess        QuestionType = "MAP_GUESS"
	// QuestionCapitalGuess    QuestionType = "CAPITAL_GUESS" // TODO: Will be added later
	QuestionSilhouetteGuess QuestionType = "SILHOUETTE_GUESS"
	QuestionEmojiGuess      QuestionType = "EMOJI_GUESS"
	// QuestionTeamGuess       QuestionType = "TEAM_GUESS" // TODO: Will be added later
	QuestionBorderGuess     QuestionType = "BORDER_GUESS"
	// QuestionAudioGuess      QuestionType = "AUDIO_GUESS" // TODO: Will be added later
)

// ModeConfig holds metadata for each game mode
type ModeConfig struct {
	IsTimed          bool         // Whether the mode has a timer
	DefaultTimeout   int          // Default seconds per round (0 for untimed)
	QuestionType     QuestionType // Type of question to generate
	MinPlayers       int          // Minimum players required (1 for single-player)
	IsTeamMode       bool         // Whether mode requires teams
	RequiresMap      bool         // Whether mode uses the world map
	IsExploration    bool         // Whether mode is exploration (no rounds)
	SupportsMultiple bool         // Whether mode supports multiplayer
}

// modeConfigs is the single source of truth for all mode metadata
var modeConfigs = map[GameMode]ModeConfig{
	ModeFlag: {
		IsTimed: true, DefaultTimeout: 15, QuestionType: QuestionFlagGuess,
		MinPlayers: 1, SupportsMultiple: true,
	},
	ModeWorldMap: {
		IsTimed: false, DefaultTimeout: 0, QuestionType: QuestionMapGuess,
		MinPlayers: 1, RequiresMap: true, SupportsMultiple: true,
	},
	// ModeCapitalRush: {
	// 	IsTimed: true, DefaultTimeout: 15, QuestionType: QuestionCapitalGuess,
	// 	MinPlayers: 1, SupportsMultiple: true,
	// }, // TODO: Will be added later
	ModeSilhouette: {
		IsTimed: true, DefaultTimeout: 15, QuestionType: QuestionSilhouetteGuess,
		MinPlayers: 1, SupportsMultiple: true,
	},
	ModeEmoji: {
		IsTimed: true, DefaultTimeout: 15, QuestionType: QuestionEmojiGuess,
		MinPlayers: 1, SupportsMultiple: true,
	},
	// ModeTeamBattle: {
	// 	IsTimed: true, DefaultTimeout: 15, QuestionType: QuestionTeamGuess,
	// 	MinPlayers: 2, IsTeamMode: true, SupportsMultiple: true,
	// }, // TODO: Will be added later
	ModeLastStanding: {
		IsTimed: true, DefaultTimeout: 15, QuestionType: QuestionFlagGuess,
		MinPlayers: 1, SupportsMultiple: true,
	},
	ModeBorderLogic: {
		IsTimed: true, DefaultTimeout: 20, QuestionType: QuestionBorderGuess,
		MinPlayers: 1, SupportsMultiple: true,
	},
	// ModeAudio: {
	// 	IsTimed: true, DefaultTimeout: 20, QuestionType: QuestionAudioGuess,
	// 	MinPlayers: 1, SupportsMultiple: true,
	// }, // TODO: Will be added later
}

// IsTimedMode returns true if the mode uses a timer
func IsTimedMode(mode string) bool {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.IsTimed
	}
	// Default to timed for unknown modes (fail safe)
	return true
}

// IsTeamMode returns true if the mode is team-based
func IsTeamMode(mode string) bool {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.IsTeamMode
	}
	return false
}

// GetDefaultTimeout returns the default timeout for a mode
func GetDefaultTimeout(mode string) int {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.DefaultTimeout
	}
	return 15 // Default
}

// GetQuestionType returns the question type for a mode
func GetQuestionType(mode string) QuestionType {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.QuestionType
	}
	return QuestionFlagGuess // Default
}

// GetModeConfig returns the full config for a mode
func GetModeConfig(mode string) (ModeConfig, bool) {
	cfg, ok := modeConfigs[GameMode(mode)]
	return cfg, ok
}

// IsExplorationMode returns true if mode has no rounds (free exploration)
func IsExplorationMode(mode string) bool {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.IsExploration
	}
	return false
}

// RequiresMap returns true if mode uses the world map
func RequiresMap(mode string) bool {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.RequiresMap
	}
	return false
}

// GetMinPlayers returns minimum players required for a mode
func GetMinPlayers(mode string) int {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.MinPlayers
	}
	return 1
}

// IsValidMode returns true if the mode is recognized
func IsValidMode(mode string) bool {
	_, ok := modeConfigs[GameMode(mode)]
	return ok
}

// AllModes returns a list of all valid game modes
func AllModes() []GameMode {
	modes := make([]GameMode, 0, len(modeConfigs))
	for mode := range modeConfigs {
		modes = append(modes, mode)
	}
	return modes
}
