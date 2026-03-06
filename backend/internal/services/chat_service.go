package services

import (
	"sync"
	"time"
)

// ChatMessage represents a chat message
type ChatMessage struct {
	ID        string            `json:"id"`
	Player    string            `json:"player"`
	Message   string            `json:"message"`
	Timestamp int64             `json:"timestamp"`
	Reactions map[string]int    `json:"reactions"`
}

// ChatService manages chat messages
type ChatService struct {
	messages map[string][]*ChatMessage
	mu       sync.RWMutex
}

var chatService = &ChatService{
	messages: make(map[string][]*ChatMessage),
}

// GetChatService returns the global chat service
func GetChatService() *ChatService {
	return chatService
}

// AddMessage adds a chat message to a room
func (cs *ChatService) AddMessage(roomID, player, message string) *ChatMessage {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	msg := &ChatMessage{
		ID:        roomID + "_" + player + "_" + time.Now().Format("20060102150405"),
		Player:    player,
		Message:   message,
		Timestamp: time.Now().UnixMilli(),
		Reactions: make(map[string]int),
	}

	if cs.messages[roomID] == nil {
		cs.messages[roomID] = make([]*ChatMessage, 0)
	}

	cs.messages[roomID] = append(cs.messages[roomID], msg)

	// Keep only last 50 messages
	if len(cs.messages[roomID]) > 50 {
		cs.messages[roomID] = cs.messages[roomID][1:]
	}

	return msg
}

// AddReaction adds a reaction to a message
func (cs *ChatService) AddReaction(roomID, messageID, emoji string) bool {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	if cs.messages[roomID] == nil {
		return false
	}

	for _, msg := range cs.messages[roomID] {
		if msg.ID == messageID {
			msg.Reactions[emoji]++
			return true
		}
	}

	return false
}

// GetMessages retrieves all messages for a room
func (cs *ChatService) GetMessages(roomID string) []*ChatMessage {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	if cs.messages[roomID] == nil {
		return []*ChatMessage{}
	}

	return cs.messages[roomID]
}

// ClearRoom clears messages for a room
func (cs *ChatService) ClearRoom(roomID string) {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	delete(cs.messages, roomID)
}
