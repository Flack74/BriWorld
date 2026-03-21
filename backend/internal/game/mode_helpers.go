package game

func IsTimedMode(mode string) bool {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.IsTimed
	}
	return true
}

func IsTeamMode(mode string) bool {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.IsTeamMode
	}
	return false
}

func GetDefaultTimeout(mode string) int {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.DefaultTimeout
	}
	return 15
}

func GetQuestionType(mode string) QuestionType {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.QuestionType
	}
	return QuestionFlagGuess
}

func GetModeConfig(mode string) (ModeConfig, bool) {
	cfg, ok := modeConfigs[GameMode(mode)]
	return cfg, ok
}

func IsExplorationMode(mode string) bool {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.IsExploration
	}
	return false
}

func RequiresMap(mode string) bool {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.RequiresMap
	}
	return false
}

func GetMinPlayers(mode string) int {
	if cfg, ok := modeConfigs[GameMode(mode)]; ok {
		return cfg.MinPlayers
	}
	return 1
}

func IsValidMode(mode string) bool {
	_, ok := modeConfigs[GameMode(mode)]
	return ok
}

func AllModes() []GameMode {
	modes := make([]GameMode, 0, len(modeConfigs))
	for m := range modeConfigs {
		modes = append(modes, m)
	}
	return modes
}
