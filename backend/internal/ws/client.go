package ws

import (
	"briworld/internal/domain"
	"context"
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
)

type Client struct {
	ID                  string
	Username            string
	SessionID           string
	RoomID              string
	Conn                *websocket.Conn
	Send                chan []byte
	Room                *Room
	RoundsCount         int
	GameMode            string
	RoomType            string
	IsGuest             bool
	IsSpectator         bool
	AvatarURL           string
	TimeoutSeconds      int
	Role                domain.ClientRole
	State               domain.ClientState
	DisconnectedAt      time.Time
	ReconnectCancelFunc context.CancelFunc
	writeMu             sync.Mutex
}

type Message struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}
