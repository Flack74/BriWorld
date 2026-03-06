package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/websocket/v2"
)

const (
	writeWait      = 5 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = 54 * time.Second
	maxMessageSize = 512 * 1024
)

// ReadPump handles incoming messages from the client
// Runs in its own goroutine, exits on connection close
func (c *Client) ReadPump() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC RECOVERY] ReadPump for %s: %v", c.Username, r)
		}
		// Unregister triggers cleanup
		if c.Room != nil {
			c.Room.Unregister <- c
		}
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf("[WS] Client %s disconnected: %v", c.Username, err)
			}
			// Normal close - no logging needed
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("[WS] Invalid message from %s: %v", c.Username, err)
			continue
		}

		if c.Room != nil {
			c.Room.HandleMessage(c, &msg)
		}
	}
}

// WritePump handles outgoing messages to the client
// Runs in its own goroutine, exits when send channel closes
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.writeMu.Lock()
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Channel closed - graceful shutdown
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				c.writeMu.Unlock()
				return
			}

			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			c.writeMu.Unlock()
			if err != nil {
				return
			}

		case <-ticker.C:
			c.writeMu.Lock()
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			err := c.Conn.WriteMessage(websocket.PingMessage, nil)
			c.writeMu.Unlock()
			if err != nil {
				return
			}
		}
	}
}
