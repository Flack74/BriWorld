package ws

import (
	"encoding/json"
	"log"
	"strconv"
	"time"

	"briworld/internal/database"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

var GlobalHub = NewHub()

func init() {
	go GlobalHub.Run()
}

func HandleWebSocket(c *websocket.Conn) {
	roomCode := c.Query("room")
	username := c.Query("username")
	sessionID := c.Query("session")
	gameMode := c.Query("mode")
	roomType := c.Query("type")
	rounds := c.Query("rounds")
	timeout := c.Query("timeout")
	token := c.Query("token")
	
	// Check if user is authenticated
	isAuthenticated := token != ""

	if roomCode == "" || username == "" {
		log.Println("Missing room or username")
		c.Close()
		return
	}

	if sessionID == "" {
		log.Println("Missing session ID")
		c.Close()
		return
	}

	if gameMode == "" {
		gameMode = "FLAG"
	}
	if roomType == "" {
		roomType = "SINGLE"
	}

	roundsCount := 10
	if rounds != "" {
		if r, err := strconv.Atoi(rounds); err == nil && r > 0 {
			// Enforce 20 rounds limit for guest users
			if !isAuthenticated && r > 20 {
				roundsCount = 20
				log.Printf("Guest user attempted %d rounds, capped to 20", r)
			} else {
				roundsCount = r
			}
		}
	}

	timeoutSeconds := 15
	if timeout != "" {
		if t, err := strconv.Atoi(timeout); err == nil && t >= 10 && t <= 60 {
			timeoutSeconds = t
		}
	}

	// Check if room exists (O(1) lookup)
	existingRoom := GlobalHub.GetRoom(roomCode)
	room := GlobalHub.GetOrCreateRoom(roomCode)
	
	if room == nil {
		log.Printf("Room %s is closed/expired, rejecting connection", roomCode)
		msg := map[string]interface{}{
			"type": "room_expired",
			"payload": map[string]interface{}{
				"message": "This room has expired due to inactivity",
			},
		}
		if data, err := json.Marshal(msg); err == nil {
			c.WriteMessage(websocket.TextMessage, data)
		}
		time.Sleep(100 * time.Millisecond)
		c.Close()
		return
	}
	
	// Only check reconnection if room already existed
	if existingRoom != nil {
		stateManager := GetStateManager()
		if isReconnection, _ := stateManager.CheckSessionInRoom(roomCode, sessionID); isReconnection {
			if snapshot := stateManager.GetRoomState(roomCode); snapshot != nil {
				room.RestoreFromSnapshot(snapshot)
				log.Printf("Reconnection: Room %s state restored", roomCode)
			}
		}
		go stateManager.UpdateActivity(roomCode)
	} else {
		log.Printf("New room created: %s", roomCode)
	}
	
	room.mu.Lock()
	if room.GameState.GameMode == "" {
		room.GameState.GameMode = gameMode
	}
	if room.GameState.RoomType == "" {
		room.GameState.RoomType = roomType
	}
	room.mu.Unlock()

	// Fetch avatar URL from database
	avatarURL := ""
	if db := database.GetDB(); db != nil {
		var user struct {
			AvatarURL string `gorm:"column:avatar_url"`
		}
		if err := db.DB.Table("users").Select("avatar_url").Where("username = ?", username).First(&user).Error; err == nil {
			avatarURL = user.AvatarURL
		}
	}

	client := &Client{
		ID:             uuid.New().String(),
		Username:       username,
		SessionID:      sessionID,
		RoomID:         roomCode,
		Conn:           c,
		Send:           make(chan []byte, 256),
		RoundsCount:    roundsCount,
		GameMode:       gameMode,
		RoomType:       roomType,
		IsGuest:        sessionID != "",
		AvatarURL:      avatarURL,
		TimeoutSeconds: timeoutSeconds,
	}

	// Set room reference immediately to avoid race condition
	client.Room = room
	
	room.Register <- client

	go client.WritePump()
	client.ReadPump()
}

func UpgradeWebSocket(c *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(c) {
		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}
