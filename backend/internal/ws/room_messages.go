package ws

import (
	"log"
)

// HandleMessage routes incoming WebSocket messages to appropriate handlers.
func (r *Room) HandleMessage(client *Client, msg *Message) {
	switch msg.Type {
	case "start_game":
		r.StartGame(client.Username)

	case "submit_answer":
		r.HandleAnswer(client, msg.Payload)

	case "paint_country":
		r.HandleMapPaint(client, msg.Payload)

	case "set_color":
		r.SetPlayerColor(client, msg.Payload)

	case "chat_message":
		r.BroadcastChatMessage(client.Username, msg.Payload)

	case "switch_team":
		r.SwitchTeam(client, msg.Payload)

	case "accept_promotion":
		r.AcceptPromotion(client)

	case "toggle_spectator":
		r.ToggleSpectator(client)

	case "restart_game":
		r.RestartGame(client.Username)

	case "leave_room":
		// Player explicitly leaving - remove immediately
		r.Unregister <- client

	case "close_room":
		r.CloseRoom(client.Username)

	default:
		log.Printf("Unknown message type: %s from %s", msg.Type, client.Username)
	}
}
