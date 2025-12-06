package handlers

import (
	"briworld/internal/ws"
	"github.com/gofiber/fiber/v2"
)

func GetPublicRooms(c *fiber.Ctx) error {
	roomType := c.Query("type", "PUBLIC")
	gameMode := c.Query("mode", "FLAG")
	
	if roomType != "PUBLIC" {
		return c.JSON(fiber.Map{"rooms": []interface{}{}})
	}
	
	rooms := ws.GlobalHub.GetPublicRooms(gameMode)
	
	return c.JSON(fiber.Map{
		"rooms": rooms,
	})
}
