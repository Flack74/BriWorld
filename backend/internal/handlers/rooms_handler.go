package handlers

import (
	"briworld/internal/ws"
	"crypto/rand"
	"github.com/gofiber/fiber/v2"
)

// GenerateRoomCode creates a 6-character room code
func GenerateRoomCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 6)
	rand.Read(b)
	for i := range b {
		b[i] = chars[int(b[i])%len(chars)]
	}
	return string(b)
}

// CreateRoom generates a new room code
func CreateRoom(c *fiber.Ctx) error {
	var req struct {
		GameMode string `json:"game_mode"`
		RoomType string `json:"room_type"`
	}
	
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}
	
	// For public rooms, use deterministic code
	if req.RoomType == "PUBLIC" {
		return c.JSON(fiber.Map{
			"room_code": "PUBLIC_" + req.GameMode,
		})
	}
	
	// For private/single rooms, generate unique code
	roomCode := GenerateRoomCode()
	
	// Ensure uniqueness
	for ws.GlobalHub.GetRoom(roomCode) != nil {
		roomCode = GenerateRoomCode()
	}
	
	return c.JSON(fiber.Map{
		"room_code": roomCode,
	})
}

func GetPublicRooms(c *fiber.Ctx) error {
	gameMode := c.Query("mode", "")
	
	// Cache rooms for 1 second to reduce lock contention
	rooms := ws.GlobalHub.GetPublicRooms(gameMode)
	
	c.Set("Cache-Control", "public, max-age=1")
	return c.JSON(fiber.Map{
		"rooms": rooms,
	})
}
