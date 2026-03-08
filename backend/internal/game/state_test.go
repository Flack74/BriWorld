package game

import (
	"briworld/internal/domain"
	"testing"
)

// TestNewState tests the game state initialization
func TestNewState(t *testing.T) {
	state := NewState()

	// Verify initial status
	if state.Status != domain.RoomWaiting {
		t.Errorf("NewState() Status = %v, want %v", state.Status, domain.RoomWaiting)
	}

	// Verify default rounds
	if state.TotalRounds != 10 {
		t.Errorf("NewState() TotalRounds = %d, want 10", state.TotalRounds)
	}

	// Verify maps are initialized
	if state.Scores == nil {
		t.Error("NewState() Scores map is nil")
	}
	if state.Answered == nil {
		t.Error("NewState() Answered map is nil")
	}
	if state.UsedCountries == nil {
		t.Error("NewState() UsedCountries map is nil")
	}
	if state.PaintedCountries == nil {
		t.Error("NewState() PaintedCountries map is nil")
	}
	if state.PlayerColors == nil {
		t.Error("NewState() PlayerColors map is nil")
	}
	if state.Teams == nil {
		t.Error("NewState() Teams map is nil")
	}
	if state.EliminatedPlayers == nil {
		t.Error("NewState() EliminatedPlayers map is nil")
	}
	if state.MessageReactions == nil {
		t.Error("NewState() MessageReactions map is nil")
	}

	// Verify maps are empty
	if len(state.Scores) != 0 {
		t.Errorf("NewState() Scores should be empty, got %d items", len(state.Scores))
	}
	if len(state.Answered) != 0 {
		t.Errorf("NewState() Answered should be empty, got %d items", len(state.Answered))
	}

	// Verify initial round state
	if state.CurrentRound != 0 {
		t.Errorf("NewState() CurrentRound = %d, want 0", state.CurrentRound)
	}
	if state.RoundActive {
		t.Error("NewState() RoundActive should be false")
	}
	if state.Question != nil {
		t.Error("NewState() Question should be nil")
	}
}

// TestStateScoreManagement tests score tracking functionality
func TestStateScoreManagement(t *testing.T) {
	state := NewState()

	// Add players
	players := []string{"alice", "bob", "charlie"}
	for _, player := range players {
		state.Scores[player] = 0
	}

	// Verify all players added
	if len(state.Scores) != 3 {
		t.Errorf("Expected 3 players, got %d", len(state.Scores))
	}

	// Update scores
	state.Scores["alice"] = 100
	state.Scores["bob"] = 75
	state.Scores["charlie"] = 50

	// Verify scores
	if state.Scores["alice"] != 100 {
		t.Errorf("alice score = %d, want 100", state.Scores["alice"])
	}
	if state.Scores["bob"] != 75 {
		t.Errorf("bob score = %d, want 75", state.Scores["bob"])
	}
	if state.Scores["charlie"] != 50 {
		t.Errorf("charlie score = %d, want 50", state.Scores["charlie"])
	}
}

// TestStateAnsweredTracking tests player answer tracking
func TestStateAnsweredTracking(t *testing.T) {
	state := NewState()

	players := []string{"alice", "bob", "charlie"}

	// Initially no one has answered
	for _, player := range players {
		if state.Answered[player] {
			t.Errorf("Player %s should not have answered yet", player)
		}
	}

	// Mark players as answered
	state.Answered["alice"] = true
	state.Answered["bob"] = true

	// Verify tracking
	if !state.Answered["alice"] {
		t.Error("alice should be marked as answered")
	}
	if !state.Answered["bob"] {
		t.Error("bob should be marked as answered")
	}
	if state.Answered["charlie"] {
		t.Error("charlie should not be marked as answered")
	}

	// Reset for new round
	state.Answered = make(map[string]bool)
	for _, player := range players {
		if state.Answered[player] {
			t.Errorf("Player %s should be reset after new round", player)
		}
	}
}

// TestStateUsedCountries tests country tracking to avoid duplicates
func TestStateUsedCountries(t *testing.T) {
	state := NewState()

	countries := []string{"FR", "DE", "IT", "ES", "GB"}

	// Mark countries as used
	for _, code := range countries {
		state.UsedCountries[code] = true
	}

	// Verify all marked
	if len(state.UsedCountries) != 5 {
		t.Errorf("Expected 5 used countries, got %d", len(state.UsedCountries))
	}

	// Verify specific countries
	for _, code := range countries {
		if !state.UsedCountries[code] {
			t.Errorf("Country %s should be marked as used", code)
		}
	}

	// Verify unused country
	if state.UsedCountries["US"] {
		t.Error("US should not be marked as used")
	}
}

// TestStatePaintedCountries tests country painting in WORLD_MAP mode
func TestStatePaintedCountries(t *testing.T) {
	state := NewState()

	// Paint countries
	state.PaintedCountries["FR"] = "alice"
	state.PaintedCountries["DE"] = "bob"
	state.PaintedCountries["IT"] = "alice"

	// Verify ownership
	if state.PaintedCountries["FR"] != "alice" {
		t.Errorf("FR should be painted by alice, got %s", state.PaintedCountries["FR"])
	}
	if state.PaintedCountries["DE"] != "bob" {
		t.Errorf("DE should be painted by bob, got %s", state.PaintedCountries["DE"])
	}

	// Verify count
	if len(state.PaintedCountries) != 3 {
		t.Errorf("Expected 3 painted countries, got %d", len(state.PaintedCountries))
	}
}

// TestStatePlayerColors tests color assignment and duplicate prevention
func TestStatePlayerColors(t *testing.T) {
	state := NewState()

	// Assign colors
	state.PlayerColors["alice"] = "red"
	state.PlayerColors["bob"] = "blue"
	state.PlayerColors["charlie"] = "green"

	// Verify assignments
	if state.PlayerColors["alice"] != "red" {
		t.Errorf("alice color = %s, want red", state.PlayerColors["alice"])
	}

	// Check for duplicate colors (should be prevented at application level)
	colors := make(map[string]bool)
	for _, color := range state.PlayerColors {
		if colors[color] {
			t.Errorf("Duplicate color found: %s", color)
		}
		colors[color] = true
	}
}

// TestStateTeams tests team assignment for TEAM_BATTLE mode
func TestStateTeams(t *testing.T) {
	state := NewState()

	// Assign teams
	state.Teams["alice"] = "RED"
	state.Teams["bob"] = "RED"
	state.Teams["charlie"] = "BLUE"
	state.Teams["dave"] = "BLUE"

	// Verify assignments
	if state.Teams["alice"] != "RED" {
		t.Errorf("alice team = %s, want RED", state.Teams["alice"])
	}
	if state.Teams["charlie"] != "BLUE" {
		t.Errorf("charlie team = %s, want BLUE", state.Teams["charlie"])
	}

	// Count team members
	redCount := 0
	blueCount := 0
	for _, team := range state.Teams {
		switch team {
		case "RED":
			redCount++
		case "BLUE":
			blueCount++
		}
	}

	if redCount != 2 {
		t.Errorf("RED team has %d members, want 2", redCount)
	}
	if blueCount != 2 {
		t.Errorf("BLUE team has %d members, want 2", blueCount)
	}
}

// TestStateEliminatedPlayers tests player elimination for LAST_STANDING mode
func TestStateEliminatedPlayers(t *testing.T) {
	state := NewState()

	players := []string{"alice", "bob", "charlie", "dave"}
	for _, player := range players {
		state.Scores[player] = 0
	}

	// Eliminate players
	state.EliminatedPlayers["bob"] = true
	state.EliminatedPlayers["dave"] = true

	// Count active players
	activeCount := 0
	for player := range state.Scores {
		if !state.EliminatedPlayers[player] {
			activeCount++
		}
	}

	if activeCount != 2 {
		t.Errorf("Expected 2 active players, got %d", activeCount)
	}

	// Verify specific eliminations
	if !state.EliminatedPlayers["bob"] {
		t.Error("bob should be eliminated")
	}
	if state.EliminatedPlayers["alice"] {
		t.Error("alice should not be eliminated")
	}
}

// TestStateMessageReactions tests emoji reaction tracking
func TestStateMessageReactions(t *testing.T) {
	state := NewState()

	messageID := "msg123"

	// Add reactions
	if state.MessageReactions[messageID] == nil {
		state.MessageReactions[messageID] = make(map[string][]string)
	}

	state.MessageReactions[messageID]["👍"] = []string{"alice", "bob"}
	state.MessageReactions[messageID]["❤️"] = []string{"charlie"}

	// Verify reactions
	if len(state.MessageReactions[messageID]["👍"]) != 2 {
		t.Errorf("Expected 2 users for 👍, got %d", len(state.MessageReactions[messageID]["👍"]))
	}

	if len(state.MessageReactions[messageID]["❤️"]) != 1 {
		t.Errorf("Expected 1 user for ❤️, got %d", len(state.MessageReactions[messageID]["❤️"]))
	}
}

// TestQuestionStructure tests the Question struct
func TestQuestionStructure(t *testing.T) {
	question := &Question{
		Type:        "flag",
		FlagCode:    "FR",
		CountryName: "France",
		CountryCode: "FR",
		TimeLimit:   15,
	}

	if question.Type != "flag" {
		t.Errorf("Question Type = %s, want flag", question.Type)
	}
	if question.FlagCode != "FR" {
		t.Errorf("Question FlagCode = %s, want FR", question.FlagCode)
	}
	if question.CountryCode != "FR" {
		t.Errorf("Question CountryCode = %s, want FR", question.CountryCode)
	}
	if question.CountryName != "France" {
		t.Errorf("Question CountryName = %s, want France", question.CountryName)
	}
	if question.TimeLimit != 15 {
		t.Errorf("Question TimeLimit = %d, want 15", question.TimeLimit)
	}
}

// TestQuestionWithCapital tests capital question structure
func TestQuestionWithCapital(t *testing.T) {
	question := &Question{
		Type:        "capital",
		CountryCode: "FR",
		CountryName: "France",
		Capital:     "Paris",
		TimeLimit:   15,
	}

	if question.Type != "capital" {
		t.Errorf("Question Type = %s, want capital", question.Type)
	}
	if question.CountryCode != "FR" {
		t.Errorf("Question CountryCode = %s, want FR", question.CountryCode)
	}
	if question.CountryName != "France" {
		t.Errorf("Question CountryName = %s, want France", question.CountryName)
	}
	if question.TimeLimit != 15 {
		t.Errorf("Question TimeLimit = %d, want 15", question.TimeLimit)
	}
	if question.Capital != "Paris" {
		t.Errorf("Question Capital = %s, want Paris", question.Capital)
	}
}

// TestQuestionWithNeighbors tests border logic question structure
func TestQuestionWithNeighbors(t *testing.T) {
	question := &Question{
		Type:        "border",
		CountryCode: "FR",
		CountryName: "France",
		Neighbors:   []string{"Spain", "Germany", "Italy", "Belgium"},
		TimeLimit:   20,
	}

	if question.Type != "border" {
		t.Errorf("Question Type = %s, want border", question.Type)
	}
	if question.CountryCode != "FR" {
		t.Errorf("Question CountryCode = %s, want FR", question.CountryCode)
	}
	if question.CountryName != "France" {
		t.Errorf("Question CountryName = %s, want France", question.CountryName)
	}
	if question.TimeLimit != 20 {
		t.Errorf("Question TimeLimit = %d, want 20", question.TimeLimit)
	}
	if len(question.Neighbors) != 4 {
		t.Errorf("Expected 4 neighbors, got %d", len(question.Neighbors))
	}
}
