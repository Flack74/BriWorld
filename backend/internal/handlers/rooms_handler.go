package handlers

import (
	"briworld/internal/ws"
	"github.com/gofiber/fiber/v2"
)

func GetPublicRooms(c *fiber.Ctx) error {
	gameMode := c.Query("mode", "")
	
	// Cache rooms for 1 second to reduce lock contention
	rooms := ws.GlobalHub.GetPublicRooms(gameMode)
	
	c.Set("Cache-Control", "public, max-age=1")
	return c.JSON(fiber.Map{
		"rooms": rooms,
	})
}
