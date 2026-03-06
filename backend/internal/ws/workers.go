package ws

import (
	"log"
	"sync"
)

// GameStartWorkerPool manages parallel game start operations
type GameStartWorkerPool struct {
	jobs    chan *GameStartJob
	workers int
	wg      sync.WaitGroup
}

// GameStartJob represents a game start task
type GameStartJob struct {
	room     *Room
	username string
}

// NewGameStartWorkerPool creates a new worker pool with n workers
func NewGameStartWorkerPool(workers int) *GameStartWorkerPool {
	pool := &GameStartWorkerPool{
		jobs:    make(chan *GameStartJob, workers*2),
		workers: workers,
	}

	// Start workers
	for i := 0; i < workers; i++ {
		pool.wg.Add(1)
		go pool.worker()
	}

	return pool
}

// worker processes game start jobs
func (p *GameStartWorkerPool) worker() {
	defer p.wg.Done()
	for job := range p.jobs {
		p.processGameStart(job)
	}
}

// processGameStart handles the actual game start logic
func (p *GameStartWorkerPool) processGameStart(job *GameStartJob) {
	r := job.room
	username := job.username

	r.mu.Lock()

	if r.Owner != username {
		r.mu.Unlock()
		return
	}

	if r.GameState.Status != "waiting" {
		r.mu.Unlock()
		return
	}

	r.GameState.Status = "in_progress"
	r.GameState.CurrentRound = 0

	// Assign teams for TEAM_BATTLE mode
	if r.GameState.GameMode == "TEAM_BATTLE" {
		r.assignTeams()
	}

	r.mu.Unlock()

	// Send game_started immediately in background
	go r.BroadcastMessage("game_started", r.GameState)
	// Start first round in background
	go r.StartRound()
}

// Submit adds a game start job to the queue
func (p *GameStartWorkerPool) Submit(room *Room, username string) {
	select {
	case p.jobs <- &GameStartJob{room: room, username: username}:
	default:
		log.Printf("Worker pool queue full, dropping game start for room %s", room.ID)
	}
}

// Shutdown gracefully shuts down the worker pool
func (p *GameStartWorkerPool) Shutdown() {
	close(p.jobs)
	p.wg.Wait()
}

// Global worker pool instance
var gameStartPool *GameStartWorkerPool

// InitGameStartWorkers initializes the worker pool
func InitGameStartWorkers(workers int) {
	gameStartPool = NewGameStartWorkerPool(workers)
	log.Printf("Game start worker pool initialized with %d workers", workers)
}

// SubmitGameStart submits a game start job to the pool
func SubmitGameStart(room *Room, username string) {
	if gameStartPool != nil {
		gameStartPool.Submit(room, username)
	} else {
		// Fallback if pool not initialized
		room.StartGame(username)
	}
}
