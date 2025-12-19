package redis

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

const roomTTL = 30 * time.Minute

// SetPlayerColor sets a player's color with duplicate prevention
func SetPlayerColor(ctx context.Context, roomCode, username, color string) error {
	key := fmt.Sprintf("room:%s:colors", roomCode)
	
	colors, _ := Client.HGetAll(ctx, key).Result()
	for user, c := range colors {
		if c == color && user != username {
			return errors.New("color already taken")
		}
	}
	
	pipe := Client.TxPipeline()
	pipe.HSet(ctx, key, username, color)
	pipe.Expire(ctx, key, roomTTL)
	_, err := pipe.Exec(ctx)
	return err
}

// GetPlayerColors retrieves all player colors
func GetPlayerColors(ctx context.Context, roomCode string) (map[string]string, error) {
	key := fmt.Sprintf("room:%s:colors", roomCode)
	return Client.HGetAll(ctx, key).Result()
}

// AddPlayer adds a player to the room
func AddPlayer(ctx context.Context, roomCode, username string) error {
	key := fmt.Sprintf("room:%s:players", roomCode)
	pipe := Client.TxPipeline()
	pipe.SAdd(ctx, key, username)
	pipe.Expire(ctx, key, roomTTL)
	_, err := pipe.Exec(ctx)
	return err
}

// RemovePlayer removes a player from the room
func RemovePlayer(ctx context.Context, roomCode, username string) error {
	key := fmt.Sprintf("room:%s:players", roomCode)
	return Client.SRem(ctx, key, username).Err()
}

// GetPlayers retrieves all players in the room
func GetPlayers(ctx context.Context, roomCode string) ([]string, error) {
	key := fmt.Sprintf("room:%s:players", roomCode)
	return Client.SMembers(ctx, key).Result()
}

// GetPlayerCount returns the number of players
func GetPlayerCount(ctx context.Context, roomCode string) (int64, error) {
	key := fmt.Sprintf("room:%s:players", roomCode)
	return Client.SCard(ctx, key).Result()
}

// SetScore updates a player's score
func SetScore(ctx context.Context, roomCode, username string, score int) error {
	key := fmt.Sprintf("room:%s:scores", roomCode)
	pipe := Client.TxPipeline()
	pipe.HSet(ctx, key, username, score)
	pipe.Expire(ctx, key, roomTTL)
	_, err := pipe.Exec(ctx)
	return err
}

// GetScores retrieves all scores
func GetScores(ctx context.Context, roomCode string) (map[string]string, error) {
	key := fmt.Sprintf("room:%s:scores", roomCode)
	return Client.HGetAll(ctx, key).Result()
}

// PaintCountry marks a country as painted by a player
func PaintCountry(ctx context.Context, roomCode, countryCode, username string) error {
	key := fmt.Sprintf("room:%s:painted", roomCode)
	
	exists, _ := Client.HExists(ctx, key, countryCode).Result()
	if exists {
		return errors.New("country already painted")
	}
	
	pipe := Client.TxPipeline()
	pipe.HSet(ctx, key, countryCode, username)
	pipe.Expire(ctx, key, roomTTL)
	_, err := pipe.Exec(ctx)
	return err
}

// GetPaintedCountries retrieves all painted countries
func GetPaintedCountries(ctx context.Context, roomCode string) (map[string]string, error) {
	key := fmt.Sprintf("room:%s:painted", roomCode)
	return Client.HGetAll(ctx, key).Result()
}

// SetGameState saves the game state as JSON
func SetGameState(ctx context.Context, roomCode string, state interface{}) error {
	key := fmt.Sprintf("room:%s:state", roomCode)
	data, err := json.Marshal(state)
	if err != nil {
		return err
	}
	
	pipe := Client.TxPipeline()
	pipe.Set(ctx, key, data, roomTTL)
	_, err = pipe.Exec(ctx)
	return err
}

// GetGameState retrieves the game state
func GetGameState(ctx context.Context, roomCode string) ([]byte, error) {
	key := fmt.Sprintf("room:%s:state", roomCode)
	return Client.Get(ctx, key).Bytes()
}

// SetRoomMeta sets room metadata
func SetRoomMeta(ctx context.Context, roomCode string, meta map[string]interface{}) error {
	key := fmt.Sprintf("room:%s:meta", roomCode)
	pipe := Client.TxPipeline()
	pipe.HSet(ctx, key, meta)
	pipe.Expire(ctx, key, roomTTL)
	_, err := pipe.Exec(ctx)
	return err
}

// GetRoomMeta retrieves room metadata
func GetRoomMeta(ctx context.Context, roomCode string) (map[string]string, error) {
	key := fmt.Sprintf("room:%s:meta", roomCode)
	return Client.HGetAll(ctx, key).Result()
}

// UpdateRoomActivity refreshes TTL on all room keys
func UpdateRoomActivity(ctx context.Context, roomCode string) {
	keys := []string{
		fmt.Sprintf("room:%s:meta", roomCode),
		fmt.Sprintf("room:%s:players", roomCode),
		fmt.Sprintf("room:%s:colors", roomCode),
		fmt.Sprintf("room:%s:scores", roomCode),
		fmt.Sprintf("room:%s:painted", roomCode),
		fmt.Sprintf("room:%s:state", roomCode),
	}
	
	for _, key := range keys {
		Client.Expire(ctx, key, roomTTL)
	}
}

// DeleteRoom removes all room data
func DeleteRoom(ctx context.Context, roomCode string) error {
	keys := []string{
		fmt.Sprintf("room:%s:meta", roomCode),
		fmt.Sprintf("room:%s:players", roomCode),
		fmt.Sprintf("room:%s:colors", roomCode),
		fmt.Sprintf("room:%s:scores", roomCode),
		fmt.Sprintf("room:%s:painted", roomCode),
		fmt.Sprintf("room:%s:state", roomCode),
		fmt.Sprintf("room:%s:timer", roomCode),
	}
	
	return Client.Del(ctx, keys...).Err()
}

// SetTimerDeadline stores round deadline
func SetTimerDeadline(ctx context.Context, roomCode string, round int, deadline int64) error {
	key := fmt.Sprintf("room:%s:timer", roomCode)
	pipe := Client.TxPipeline()
	pipe.HSet(ctx, key, "round", round, "deadline", deadline)
	pipe.Expire(ctx, key, roomTTL)
	_, err := pipe.Exec(ctx)
	return err
}

// GetTimerDeadline retrieves round deadline
func GetTimerDeadline(ctx context.Context, roomCode string) (int64, error) {
	key := fmt.Sprintf("room:%s:timer", roomCode)
	deadline, err := Client.HGet(ctx, key, "deadline").Int64()
	return deadline, err
}

// ClearTimer removes timer data
func ClearTimer(ctx context.Context, roomCode string) error {
	key := fmt.Sprintf("room:%s:timer", roomCode)
	return Client.Del(ctx, key).Err()
}
