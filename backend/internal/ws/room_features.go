package ws

import (
	"briworld/internal/domain"
	redisClient "briworld/internal/redis"
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"
)

// SetPlayerColor assigns a color to a player with duplicate prevention.
func (r *Room) SetPlayerColor(client *Client, payload interface{}) {
	data, _ := json.Marshal(payload)
	var colorData struct {
		Color string `json:"color"`
	}
	json.Unmarshal(data, &colorData)

	// Try Redis first for atomic color selection
	if redisClient.Client != nil {
		ctx := context.Background()
		if err := redisClient.SetPlayerColor(ctx, r.ID, client.Username, colorData.Color); err != nil {
			if err.Error() == "color already taken" {
				log.Printf("Color %s already taken in room %s", colorData.Color, r.ID)
				r.SendToClient(client, "color_rejected", map[string]interface{}{
					"error": "Color already taken",
					"color": colorData.Color,
				})
				return
			}
		}

		// Sync to in-memory
		r.mu.Lock()
		r.GameState.PlayerColors[client.Username] = colorData.Color
		r.mu.Unlock()
	} else {
		// Fallback to in-memory validation
		r.mu.Lock()
		for username, color := range r.GameState.PlayerColors {
			if color == colorData.Color && username != client.Username {
				log.Printf("Color %s already taken by %s", colorData.Color, username)
				r.mu.Unlock()
				r.SendToClient(client, "color_rejected", map[string]interface{}{
					"error": "Color already taken",
					"color": colorData.Color,
				})
				return
			}
		}
		r.GameState.PlayerColors[client.Username] = colorData.Color
		r.mu.Unlock()
	}

	log.Printf("Player %s selected color %s in room %s", client.Username, colorData.Color, r.ID)
	r.BroadcastRoomUpdate()
}

// BroadcastChatMessage handles chat messages and emoji reactions.
func (r *Room) BroadcastChatMessage(username string, payload interface{}) {
	data, _ := json.Marshal(payload)
	var chat struct {
		Message string `json:"message"`
	}
	json.Unmarshal(data, &chat)

	// Check if this is a reaction (format: REACTION:messageId:emoji)
	if len(chat.Message) > 9 && chat.Message[:9] == "REACTION:" {
		r.handleEmojiReaction(username, chat.Message)
		return
	}

	// Regular chat message
	timestamp := time.Now().UnixMilli()
	r.BroadcastMessage("chat_message", map[string]interface{}{
		"player_name": username,
		"message":     chat.Message,
		"timestamp":   timestamp,
	})

	log.Printf("Chat in room %s - %s: %s", r.ID, username, chat.Message)
}

// handleEmojiReaction processes emoji reactions to messages.
func (r *Room) handleEmojiReaction(username, reactionStr string) {
	// Parse: REACTION:messageId:emoji
	parts := strings.Split(reactionStr, ":")
	if len(parts) != 3 {
		return
	}

	messageID := parts[1]
	emoji := parts[2]

	// Validate emoji
	if len(emoji) == 0 || len(emoji) > 10 {
		log.Printf("Invalid emoji format: %s", emoji)
		return
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	// Initialize reactions map
	if r.GameState.MessageReactions == nil {
		r.GameState.MessageReactions = make(map[string]map[string][]string)
	}
	if r.GameState.MessageReactions[messageID] == nil {
		r.GameState.MessageReactions[messageID] = make(map[string][]string)
	}

	// Check if user already reacted with this emoji (toggle off)
	userReacted := false
	for i, user := range r.GameState.MessageReactions[messageID][emoji] {
		if user == username {
			// Remove reaction
			r.GameState.MessageReactions[messageID][emoji] = append(
				r.GameState.MessageReactions[messageID][emoji][:i],
				r.GameState.MessageReactions[messageID][emoji][i+1:]...,
			)

			// Clean up empty arrays
			if len(r.GameState.MessageReactions[messageID][emoji]) == 0 {
				delete(r.GameState.MessageReactions[messageID], emoji)
			}
			if len(r.GameState.MessageReactions[messageID]) == 0 {
				delete(r.GameState.MessageReactions, messageID)
			}

			userReacted = true
			break
		}
	}

	if !userReacted {
		// Check emoji cap: max 20 different emojis per message
		if len(r.GameState.MessageReactions[messageID]) >= 20 {
			log.Printf("Emoji cap reached for message %s (20 different emojis)", messageID)
			return
		}

		// Add reaction
		r.GameState.MessageReactions[messageID][emoji] = append(
			r.GameState.MessageReactions[messageID][emoji],
			username,
		)
	}

	// Get current reactions
	reactions := r.GameState.MessageReactions[messageID]

	// Broadcast reaction update
	r.BroadcastMessage("message_reaction", map[string]interface{}{
		"message_id": messageID,
		"reactions":  reactions,
		"username":   username,
	})

	log.Printf("Reaction in room %s - %s reacted %s to message %s", r.ID, username, emoji, messageID)
}

// AcceptPromotion promotes a spectator to player.
func (r *Room) AcceptPromotion(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !client.IsSpectator {
		log.Printf("Promotion rejected: %s is not a spectator", client.Username)
		return
	}

	// Check if there's a player slot available
	playerCount := 0
	for c := range r.Clients {
		if !c.IsSpectator {
			playerCount++
		}
	}

	if playerCount >= 6 {
		r.SendToClient(client, "promotion_rejected", map[string]interface{}{
			"error": "No player slots available",
		})
		log.Printf("Promotion rejected: room full for %s", client.Username)
		return
	}

	client.IsSpectator = false
	if _, exists := r.GameState.Scores[client.Username]; !exists {
		r.GameState.Scores[client.Username] = 0
	}

	log.Printf("Spectator %s promoted to player in room %s", client.Username, r.ID)
	r.SendToClient(client, "promotion_accepted", map[string]interface{}{
		"message": "You are now a player",
	})
	r.BroadcastRoomUpdate()
}

// ToggleSpectator allows a player to switch to spectator mode.
func (r *Room) ToggleSpectator(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if client.IsSpectator {
		log.Printf("Toggle rejected: %s is already a spectator", client.Username)
		return
	}

	// Only allow if game hasn't started
	if r.GameState.Status != domain.RoomWaiting {
		r.SendToClient(client, "toggle_rejected", map[string]interface{}{
			"error": "Cannot switch to spectator during active game",
		})
		log.Printf("Toggle rejected: game in progress for %s", client.Username)
		return
	}

	client.IsSpectator = true
	delete(r.GameState.Scores, client.Username)

	log.Printf("Player %s switched to spectator in room %s", client.Username, r.ID)
	r.SendToClient(client, "toggle_accepted", map[string]interface{}{
		"message": "You are now a spectator",
	})
	r.BroadcastRoomUpdate()
}
