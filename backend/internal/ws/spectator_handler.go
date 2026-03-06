package ws

import (
	"log"
	"github.com/gofiber/websocket/v2"
)

func HandleSpectatorWebSocket(c *websocket.Conn) {
	roomCode := c.Params("roomCode")
	username := c.Query("username", "Spectator")
	
	spectator := &Spectator{
		Username: username,
		Send:     make(chan []byte, 256),
	}
	
	room := GlobalHub.GetRoom(roomCode)
	if room == nil {
		log.Printf("Room %s not found for spectator", roomCode)
		c.Close()
		return
	}
	
	spectator.Room = room
	GlobalSpectatorManager.AddSpectator(roomCode, spectator)
	
	defer func() {
		GlobalSpectatorManager.RemoveSpectator(roomCode, spectator)
		close(spectator.Send)
	}()
	
	go func() {
		for message := range spectator.Send {
			if err := c.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("Spectator write error: %v", err)
				return
			}
		}
	}()
	
	for {
		_, _, err := c.ReadMessage()
		if err != nil {
			log.Printf("Spectator read error: %v", err)
			break
		}
	}
}
