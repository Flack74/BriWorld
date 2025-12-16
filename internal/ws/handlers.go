package ws

import (
	"log"
	"strconv"

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
	gameMode := c.Query("mode")
	roomType := c.Query("type")
	rounds := c.Query("rounds")

	if roomCode == "" || username == "" {
		log.Println("Missing room or username")
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
			roundsCount = r
		}
	}

	room := GlobalHub.GetOrCreateRoom(roomCode)
	room.mu.Lock()
	if room.GameState.GameMode == "" {
		room.GameState.GameMode = gameMode
	}
	if room.GameState.RoomType == "" {
		room.GameState.RoomType = roomType
	}
	room.mu.Unlock()

	client := &Client{
		ID:          uuid.New().String(),
		Username:    username,
		RoomID:      roomCode,
		Conn:        c,
		Send:        make(chan []byte, 256),
		RoundsCount: roundsCount,
		GameMode:    gameMode,
		RoomType:    roomType,
	}

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
