package ws

import (
	"briworld/internal/game"
	"context"
	"log"
	"sync"
)

// Room represents a game room where players compete in real-time.
// All state modifications are protected by mu (RWMutex).
type Room struct {
	ID                 string
	Clients            map[*Client]bool
	Broadcast          chan []byte
	Register           chan *Client
	Unregister         chan *Client
	GameState          *game.State
	Owner              string
	mu                 sync.RWMutex
	ctx                context.Context
	cancel             context.CancelFunc
	inactiveRoundCount int
	isCleanedUp        bool
}

// NewRoom creates a new game room with the given ID.
func NewRoom(id string) *Room {
	ctx, cancel := context.WithCancel(context.Background())

	return &Room{
		ID:          id,
		Clients:     make(map[*Client]bool),
		Broadcast:   make(chan []byte, 1024),
		Register:    make(chan *Client, 64),
		Unregister:  make(chan *Client, 64),
		GameState:   game.NewState(),
		ctx:         ctx,
		cancel:      cancel,
		isCleanedUp: false,
	}
}

// Run is the main event loop for the room.
// It handles client registration, unregistration, and message broadcasting.
// This runs in its own goroutine and should be started with go room.Run().
func (r *Room) Run() {
	defer func() {
		if rec := recover(); rec != nil {
			log.Printf("Room %s panic recovered: %v", r.ID, rec)
		}
	}()

	for {
		select {
		case client := <-r.Register:
			r.AddClient(client)

		case client := <-r.Unregister:
			r.RemoveClient(client)

		case message := <-r.Broadcast:
			r.broadcastToClients(message)

		case <-r.ctx.Done():
			log.Printf("Room %s event loop stopped", r.ID)
			return
		}
	}
}

// broadcastToClients sends a message to all connected clients.
func (r *Room) broadcastToClients(message []byte) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for client := range r.Clients {
		select {
		case client.Send <- message:
		default:
			log.Printf("Client %s send buffer full, skipping message", client.Username)
		}
	}
}
