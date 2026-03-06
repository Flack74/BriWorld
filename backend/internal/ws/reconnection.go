package ws

import (
	"context"
	"log"
	"sync"
	"time"
)

const DisconnectGracePeriod = 90 * time.Second

// ReconnectionManager handles disconnect grace periods
type ReconnectionManager struct {
	timers map[string]*ReconnectTimer
	mu     sync.RWMutex
}

type ReconnectTimer struct {
	Username   string
	RoomID     string
	Timer      *time.Timer
	CancelFunc context.CancelFunc
	StartedAt  time.Time
}

func NewReconnectionManager() *ReconnectionManager {
	return &ReconnectionManager{
		timers: make(map[string]*ReconnectTimer),
	}
}

func (rm *ReconnectionManager) StartTimer(roomID, username string, onExpire func()) context.CancelFunc {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	key := roomID + ":" + username

	// Cancel existing timer
	if existing, ok := rm.timers[key]; ok {
		existing.Timer.Stop()
		if existing.CancelFunc != nil {
			existing.CancelFunc()
		}
	}

	ctx, cancel := context.WithCancel(context.Background())

	timer := time.AfterFunc(DisconnectGracePeriod, func() {
		select {
		case <-ctx.Done():
			return
		default:
			onExpire()
			rm.RemoveTimer(roomID, username)
		}
	})

	rm.timers[key] = &ReconnectTimer{
		Username:   username,
		RoomID:     roomID,
		Timer:      timer,
		CancelFunc: cancel,
		StartedAt:  time.Now(),
	}

	log.Printf("Reconnection timer started for %s in room %s (90s)", username, roomID)
	return cancel
}

func (rm *ReconnectionManager) CancelTimer(roomID, username string) bool {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	key := roomID + ":" + username
	if rt, ok := rm.timers[key]; ok {
		rt.Timer.Stop()
		if rt.CancelFunc != nil {
			rt.CancelFunc()
		}
		delete(rm.timers, key)
		log.Printf("Reconnection timer cancelled for %s in room %s", username, roomID)
		return true
	}
	return false
}

func (rm *ReconnectionManager) RemoveTimer(roomID, username string) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	key := roomID + ":" + username
	delete(rm.timers, key)
}

func (rm *ReconnectionManager) GetRemainingTime(roomID, username string) int {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	key := roomID + ":" + username
	if rt, ok := rm.timers[key]; ok {
		elapsed := time.Since(rt.StartedAt)
		remaining := DisconnectGracePeriod - elapsed
		if remaining < 0 {
			return 0
		}
		return int(remaining.Seconds())
	}
	return 0
}

var GlobalReconnectionManager = NewReconnectionManager()
