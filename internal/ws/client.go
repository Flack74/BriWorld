package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/websocket/v2"
)

type Client struct {
	ID             string
	Username       string
	SessionID      string
	RoomID         string
	Conn           *websocket.Conn
	Send           chan []byte
	Room           *Room
	RoundsCount    int
	GameMode       string
	RoomType       string
	IsGuest        bool
	AvatarURL      string
	TimeoutSeconds int
}

type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func (c *Client) ReadPump() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic in ReadPump for client %s: %v", c.Username, r)
		}
		if c.Room != nil {
			c.Room.Unregister <- c
		}
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		if c.Room != nil {
			c.Room.HandleMessage(c, &msg)
		} else {
			log.Printf("Client %s has no room assigned, ignoring message %s", c.Username, msg.Type)
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
