package ws

import (
	"briworld/internal/domain"
	"context"
	"strconv"

	redis "github.com/redis/go-redis/v9"
)

type SnapshotBuilder struct {
	redisClient *redis.Client
}

func NewSnapshotBuilder(rc *redis.Client) *SnapshotBuilder {
	return &SnapshotBuilder{redisClient: rc}
}

// Build creates a deep copy snapshot from room state
// Must be called with room.mu held (RLock)
func (sb *SnapshotBuilder) Build(r *Room, client *Client) map[string]interface{} {
	scores := make(map[string]int, len(r.GameState.Scores))
	for k, v := range r.GameState.Scores {
		scores[k] = v
	}

	painted := make(map[string]string, len(r.GameState.PaintedCountries))
	for k, v := range r.GameState.PaintedCountries {
		painted[k] = v
	}

	colors := make(map[string]string, len(r.GameState.PlayerColors))
	for k, v := range r.GameState.PlayerColors {
		colors[k] = v
	}

	eliminated := make(map[string]bool, len(r.GameState.EliminatedPlayers))
	for k, v := range r.GameState.EliminatedPlayers {
		eliminated[k] = v
	}

	disconnected := make(map[string]int)
	for c := range r.Clients {
		if c.State == domain.StateDisconnected {
			remaining := GlobalReconnectionManager.GetRemainingTime(r.ID, c.Username)
			disconnected[c.Username] = remaining
		}
	}

	var deadline int64
	if sb.redisClient != nil {
		ctx := context.Background()
		if result, err := sb.redisClient.Get(ctx, "timer:"+r.ID).Result(); err == nil {
			if dl, err := strconv.ParseInt(result, 10, 64); err == nil {
				deadline = dl
			}
		}
	}

	// Build player list and avatars
	players := make([]string, 0, len(r.Clients))
	playerAvatars := make(map[string]string)
	playerBanners := make(map[string]string)
	for c := range r.Clients {
		players = append(players, c.Username)
		playerAvatars[c.Username] = c.AvatarURL
		if c.BannerURL != "" {
			playerBanners[c.Username] = c.BannerURL
		}
	}

	return map[string]interface{}{
		"status":               r.GameState.Status,
		"current_round":        r.GameState.CurrentRound,
		"total_rounds":         r.GameState.TotalRounds,
		"round_time_limit":     r.GameState.RoundTimeLimit,
		"question":             r.GameState.Question,
		"scores":               scores,
		"round_deadline":       deadline,
		"game_mode":            r.GameState.GameMode,
		"room_type":            r.GameState.RoomType,
		"map_mode":             r.GameState.MapMode,
		"owner":                r.Owner,
		"painted_countries":    painted,
		"player_colors":        colors,
		"eliminated_players":   eliminated,
		"disconnected_players": disconnected,
		"role":                 client.Role,
		"players":              players,
		"player_avatars":       playerAvatars,
		"player_banners":       playerBanners,
		"current_count":        len(r.Clients),
		"time_remaining":       r.GameState.TimeRemaining,
		"answered":             r.GameState.Answered,
	}
}
