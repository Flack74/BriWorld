# 🌍 Understanding BriWorld - Complete Developer Guide

> **A comprehensive guide to understanding, developing, and extending the BriWorld multiplayer geography quiz game.**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Frontend Structure](#frontend-structure)
4. [Backend Structure](#backend-structure)
5. [WebSocket Communication](#websocket-communication)
6. [Game Flow](#game-flow)
7. [Adding New Features](#adding-new-features)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Developer Tips](#developer-tips)

---

## 🎯 Project Overview

### What is BriWorld?

BriWorld is a **real-time multiplayer geography quiz game** featuring:
- 9 game modes (Flag Quiz, World Map, Capital Rush, Silhouette, Emoji, Team Battle, Last Standing, Border Logic)
- Up to 6 players per room
- WebSocket-based real-time synchronization
- Server-authoritative game logic
- Persistent player sessions with Redis
- JWT authentication

`NOTE: Capital Rush and Team Battle are still in development`
### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- D3.js (interactive maps)
- WebSocket (real-time)

**Backend:**
- Go 1.25 + Fiber v2
- Neon PostgreSQL (database)
- Upstash Redis (sessions)
- WebSocket (gorilla/websocket)
- JWT authentication

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │ WebSocket
       ▼
┌─────────────┐
│  Go Server  │
│   (Fiber)   │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌──────┐ ┌──────┐
│ Neon │ │Redis │
│  DB  │ │Cache │
└──────┘ └──────┘
```

### Data Flow

```
User Action (Click/Type)
    ↓
React Component
    ↓
WebSocket Send
    ↓
Go WebSocket Handler
    ↓
Game Manager (validates)
    ↓
Update Game State
    ↓
Broadcast to All Clients
    ↓
React State Update
    ↓
UI Re-render
```

---

## 🎨 Frontend Structure

### Directory Layout

```
frontend/src/
├── components/          # Reusable UI components
│   ├── GameBanners.tsx     # Success/Error feedback
│   ├── GameOverModal.tsx   # Game completion
│   ├── CongratsModal.tsx   # Achievement celebration
│   ├── LoadingSpinner.tsx  # Loading states
│   ├── WorldMapLayout.tsx  # World Map mode layout
│   ├── QuizModeLayout.tsx  # Quiz modes layout
│   ├── Leaderboard.tsx     # Player scores
│   ├── GameChat.tsx        # Multiplayer chat
│   └── ...
│
├── hooks/               # Custom React hooks
│   ├── useWebSocket.ts     # WebSocket connection
│   ├── useGameState.ts     # Game statistics
│   ├── useBanners.ts       # Banner visibility
│   ├── usePlayers.ts       # Player data
│   ├── useGameModals.ts    # Modal states
│   ├── useAudioManager.ts  # Audio initialization
│   ├── useColorManagement.ts # Color picker
│   ├── useGameAutoStart.ts # Auto-start logic
│   └── useChatMessages.ts  # Chat transformation
│
├── pages/               # Page components
│   ├── Game.tsx            # Main game page (374 lines)
│   ├── Lobby.tsx           # Game lobby
│   ├── WaitingRoom.tsx     # Multiplayer waiting
│   └── ...
│
├── modes/               # Game mode renderers
│   └── ModeRenderer.tsx    # Mode-specific UI
│
├── types/               # TypeScript types
│   └── game.ts             # Game interfaces
│
└── lib/                 # Utilities
    ├── api.ts              # API client
    ├── audioManager.ts     # Sound effects
    └── ...
```

### Key Frontend Files

#### `Game.tsx` - Main Game Component
**Location:** `frontend/src/pages/Game.tsx`

**Purpose:** Orchestrates the entire game experience

**Responsibilities:**
- WebSocket connection management
- Game state coordination
- Layout rendering (World Map vs Quiz modes)
- Modal management
- Event handling

**When to modify:**
- Adding new game-wide features
- Changing layout structure
- Modifying WebSocket message handling

**Code Structure:**
```typescript
const Game = () => {
  // 1. Initialize hooks
  const { ws, gameState, roomUpdate } = useWebSocket({...});
  const { players } = usePlayers({...});
  const { showGameOver } = useGameModals({...});
  
  // 2. Handle events
  useEffect(() => {
    // WebSocket message handlers
  }, [ws]);
  
  // 3. Render layout
  if (gameMode === 'WORLD_MAP') {
    return <WorldMapLayout {...props} />;
  }
  return <QuizModeLayout {...props} />;
};
```

---

#### `useWebSocket.ts` - WebSocket Hook
**Location:** `frontend/src/hooks/useWebSocket.ts`

**Purpose:** Manages WebSocket connection and message handling

**Key Functions:**
- `connect()` - Establishes WebSocket connection
- `sendAnswer()` - Submits player answer
- `sendChatMessage()` - Sends chat message
- `startGame()` - Triggers game start
- `selectColor()` - Sets player color (World Map)

**Message Types Handled:**
- `room_update` - Room state changes
- `game_state` - Game state updates
- `chat_message` - Chat messages
- `answer_submitted` - Answer feedback
- `round_started` - New round begins
- `round_ended` - Round completion
- `game_completed` - Game finished

**When to modify:**
- Adding new WebSocket message types
- Changing connection logic
- Modifying reconnection behavior

---

#### Custom Hooks Overview

**`useGameState.ts`** - Game statistics and round tracking
- Tracks correct/incorrect answers
- Manages guessed countries
- Handles round state

**`useBanners.ts`** - Banner visibility and timing
- Shows success/error/timeout banners
- Auto-dismisses after delay

**`usePlayers.ts`** - Player data transformation
- Converts server data to UI format
- Manages player avatars
- Sorts leaderboard

**`useGameModals.ts`** - Modal state management
- Game over modal
- Congrats modal (197 countries)
- Reconnection dialog

**`useAudioManager.ts`** - Audio initialization
- Initializes background music
- Handles user interaction requirements

**`useColorManagement.ts`** - Color picker (World Map)
- Shows color picker modal
- Handles color selection
- Syncs with server

**`useGameAutoStart.ts`** - Auto-start logic
- Auto-starts single-player games
- Handles World Map initialization

**`useChatMessages.ts`** - Chat transformation
- Formats messages for display
- Handles @mentions
- Plays notification sounds

---

### Component Architecture

#### Layout Components

**`WorldMapLayout.tsx`** - World Map mode layout
- Desktop: 3-column (Leaderboard | Map | Chat)
- Mobile: Stacked (Map | Input | Chat)
- Handles country painting
- Real-time color synchronization

**`QuizModeLayout.tsx`** - Quiz modes layout
- Desktop: 3-column (Leaderboard | Quiz | Chat)
- Mobile: Stacked (Quiz | Leaderboard | Chat)
- Timer display
- Round counter

#### Feedback Components

**`GameBanners.tsx`** - Answer feedback
- `SuccessBanner` - Correct answer
- `ErrorBanner` - Wrong answer
- `TimeoutBanner` - Time's up
- `AlreadyGuessedBanner` - Duplicate guess

**`GameOverModal.tsx`** - Game completion
- Final score display
- Play again button
- Back to lobby button

**`CongratsModal.tsx`** - Achievement celebration
- Shows when all 197 countries found
- Celebration animation

**`LoadingSpinner.tsx`** - Loading states
- Customizable message
- Glassmorphism design

---

## 🔧 Backend Structure

### Directory Layout

```
backend/
├── cmd/server/          # Application entry point
│   └── main.go             # Server initialization
│
├── internal/
│   ├── bootstrap/       # App initialization
│   │   └── app.go          # Bootstrap logic
│   │
│   ├── config/          # Configuration
│   │   └── config.go       # Environment variables
│   │
│   ├── database/        # Database layer
│   │   ├── database.go     # Connection setup
│   │   └── migrations.go   # Auto-migrations
│   │
│   ├── domain/          # Domain models
│   │   ├── client.go       # Client types
│   │   └── room.go         # Room types
│   │
│   ├── game/            # Game logic
│   │   ├── country.go      # Country data
│   │   ├── question.go     # Question generation
│   │   └── modes.go        # Mode-specific logic
│   │
│   ├── handlers/        # HTTP handlers
│   │   ├── auth.go         # Authentication
│   │   ├── user.go         # User management
│   │   └── room.go         # Room management
│   │
│   ├── http/            # HTTP routes
│   │   └── routes.go       # Route definitions
│   │
│   ├── middleware/      # HTTP middleware
│   │   └── auth.go         # JWT validation
│   │
│   ├── models/          # Database models
│   │   ├── user.go         # User model
│   │   └── room.go         # Room model
│   │
│   ├── redis/           # Redis client
│   │   └── redis.go        # Session management
│   │
│   ├── services/        # Business logic
│   │   ├── auth.go         # Auth service
│   │   └── user.go         # User service
│   │
│   ├── utils/           # Utilities
│   │   ├── jwt.go          # JWT helpers
│   │   └── fuzzy.go        # Fuzzy matching
│   │
│   └── ws/              # WebSocket
│       ├── hub.go          # Connection hub
│       ├── client.go       # Client connection
│       ├── room.go         # Room management
│       └── handlers.go     # Message handlers
│
└── static/              # Static data
    ├── world.json          # Country data
    ├── capitals.json       # Capital cities
    └── borders.json        # Country borders
```

### Key Backend Files

#### `hub.go` - WebSocket Hub
**Location:** `backend/internal/ws/hub.go`

**Purpose:** Central WebSocket connection manager

**Responsibilities:**
- Manages all active WebSocket connections
- Routes messages to appropriate rooms
- Handles client registration/unregistration
- Broadcasts messages to clients

**Key Structures:**
```go
type Hub struct {
    rooms      map[string]*Room    // Active game rooms
    register   chan *Client        // Register new clients
    unregister chan *Client        // Unregister clients
    broadcast  chan *BroadcastMsg  // Broadcast messages
    mu         sync.RWMutex        // Thread safety
}
```

**Goroutines:**
- `Run()` - Main event loop processing registration, unregistration, and broadcasts

**When to modify:**
- Adding new room management features
- Changing connection handling
- Modifying broadcast logic

---

#### `room.go` - Game Room
**Location:** `backend/internal/ws/room.go`

**Purpose:** Manages individual game room state and logic

**Responsibilities:**
- Player management
- Game state tracking
- Round management
- Score calculation
- Message broadcasting

**Key Structures:**
```go
type Room struct {
    ID         string
    Clients    map[*Client]bool
    GameState  *GameState
    mu         sync.RWMutex
    // ... other fields
}
```

**Key Methods:**
- `BroadcastMessage()` - Send message to all players
- `StartGame()` - Initialize game
- `StartRound()` - Begin new round
- `HandleAnswer()` - Process player answer
- `EndRound()` - Complete round
- `EndGame()` - Finish game

**When to modify:**
- Adding new game modes
- Changing game rules
- Modifying scoring logic

---

#### `client.go` - WebSocket Client
**Location:** `backend/internal/ws/client.go`

**Purpose:** Represents individual WebSocket connection

**Responsibilities:**
- Reading messages from client
- Writing messages to client
- Connection lifecycle management

**Key Structures:**
```go
type Client struct {
    ID        string
    Username  string
    Conn      *websocket.Conn
    Send      chan []byte
    Room      *Room
    // ... other fields
}
```

**Goroutines:**
- `ReadPump()` - Reads messages from WebSocket
- `WritePump()` - Writes messages to WebSocket

**When to modify:**
- Changing message format
- Adding client-specific features
- Modifying connection handling

---

#### `question.go` - Question Generation
**Location:** `backend/internal/game/question.go`

**Purpose:** Generates questions for different game modes

**Key Functions:**
- `GenerateQuestion()` - Creates mode-specific questions
- `GenerateFlagQuestion()` - Flag quiz questions
- `GenerateCapitalQuestion()` - Capital city questions
- `GenerateSilhouetteQuestion()` - Silhouette questions
- `GenerateBorderQuestion()` - Border logic questions

**When to modify:**
- Adding new game modes
- Changing question difficulty
- Modifying question format

---

## 🔌 WebSocket Communication

### Message Flow

```
Client                    Server
  │                         │
  ├─ join_room ────────────>│
  │<──── room_update ───────┤
  │                         │
  ├─ start_game ───────────>│
  │<──── game_state ────────┤
  │<──── round_started ─────┤
  │                         │
  ├─ submit_answer ────────>│
  │<──── answer_submitted ──┤ (broadcast to all)
  │<──── score_update ──────┤
  │                         │
  │<──── round_ended ───────┤
  │<──── game_completed ────┤
```

### Message Types

#### Client → Server

**`join_room`**
```json
{
  "type": "join_room",
  "payload": {
    "room_code": "ABC123",
    "username": "player1",
    "game_mode": "FLAG"
  }
}
```

**`submit_answer`**
```json
{
  "type": "submit_answer",
  "payload": {
    "answer": "Brazil",
    "response_time": 2500
  }
}
```

**`start_game`**
```json
{
  "type": "start_game"
}
```

**`chat_message`**
```json
{
  "type": "chat_message",
  "payload": {
    "message": "Hello!"
  }
}
```

#### Server → Client

**`room_update`**
```json
{
  "type": "room_update",
  "payload": {
    "room_code": "ABC123",
    "players": ["player1", "player2"],
    "status": "waiting",
    "owner": "player1"
  }
}
```

**`game_state`**
```json
{
  "type": "game_state",
  "payload": {
    "status": "in_progress",
    "current_round": 3,
    "total_rounds": 10,
    "time_remaining": 12,
    "question": {
      "flag_url": "https://...",
      "options": ["Brazil", "Argentina", "Chile"]
    },
    "scores": {
      "player1": 250,
      "player2": 180
    }
  }
}
```

**`answer_submitted`**
```json
{
  "type": "answer_submitted",
  "payload": {
    "player": "player1",
    "is_correct": true,
    "country_name": "Brazil",
    "points_earned": 85
  }
}
```

---

## 🎮 Game Flow

### Complete Game Lifecycle

```
1. Player enters lobby
   ↓
2. Selects game mode
   ↓
3. Chooses room type (Single/Private/Public)
   ↓
4. WebSocket connects
   ↓
5. Joins/Creates room
   ↓
6. [Multiplayer] Waits for players
   ↓
7. Game starts
   ↓
8. For each round:
   ├─ Question generated
   ├─ Timer starts
   ├─ Players submit answers
   ├─ Answers validated
   ├─ Scores updated
   ├─ Results broadcast
   └─ Next round or end game
   ↓
9. Game completes
   ↓
10. Show final scores
    ↓
11. Play again or return to lobby
```

### Round Lifecycle (Detailed)

**1. Round Start**
```go
// Server: room.go
func (r *Room) StartRound() {
    // Generate question
    question := game.GenerateQuestion(r.GameMode)
    
    // Update game state
    r.GameState.CurrentRound++
    r.GameState.Question = question
    r.GameState.TimeRemaining = r.Timeout
    
    // Broadcast to all clients
    r.BroadcastMessage("round_started", question)
    
    // Start timer goroutine
    go r.RunTimer()
}
```

**2. Player Answers**
```typescript
// Client: Game.tsx
const handleSubmitAnswer = (answer: string) => {
  const responseTime = Date.now() - startTime;
  sendAnswer(answer, responseTime);
};
```

**3. Answer Validation**
```go
// Server: room.go
func (r *Room) HandleAnswer(client *Client, answer string, responseTime int) {
    // Validate answer
    isCorrect := game.ValidateAnswer(answer, r.GameState.Question.CorrectAnswer)
    
    // Calculate points (time-based)
    points := calculatePoints(responseTime, isCorrect)
    
    // Update score
    r.GameState.Scores[client.Username] += points
    
    // Broadcast result
    r.BroadcastMessage("answer_submitted", AnswerResult{
        Player: client.Username,
        IsCorrect: isCorrect,
        Points: points,
    })
}
```

**4. Round End**
```go
// Server: room.go
func (r *Room) EndRound() {
    // Stop timer
    r.StopTimer()
    
    // Broadcast round end
    r.BroadcastMessage("round_ended", RoundResult{
        CorrectAnswer: r.GameState.Question.CorrectAnswer,
        Scores: r.GameState.Scores,
    })
    
    // Check if game complete
    if r.GameState.CurrentRound >= r.GameState.TotalRounds {
        r.EndGame()
    } else {
        // Start next round after delay
        time.Sleep(3 * time.Second)
        r.StartRound()
    }
}
```

---

## ➕ Adding New Features

### Adding a New Game Mode

**Step 1: Define Mode Constants**
```go
// backend/internal/domain/game.go
const (
    GameModeNewMode = "NEW_MODE"
)
```

**Step 2: Create Question Generator**
```go
// backend/internal/game/question.go
func GenerateNewModeQuestion(countries []Country) *Question {
    // Select random country
    country := countries[rand.Intn(len(countries))]
    
    return &Question{
        Type: "new_mode",
        Data: map[string]interface{}{
            "hint": country.SomeProperty,
            "correct_answer": country.Name,
        },
    }
}
```

**Step 3: Add to Question Generator**
```go
// backend/internal/game/question.go
func GenerateQuestion(mode string, countries []Country) *Question {
    switch mode {
    case GameModeNewMode:
        return GenerateNewModeQuestion(countries)
    // ... other modes
    }
}
```

**Step 4: Create Frontend Mode Component**
```typescript
// frontend/src/modes/NewMode.tsx
export const NewMode = ({ question, onSubmit }) => {
  return (
    <div>
      <h2>New Mode</h2>
      <p>{question.hint}</p>
      <input onSubmit={onSubmit} />
    </div>
  );
};
```

**Step 5: Add to Mode Renderer**
```typescript
// frontend/src/modes/ModeRenderer.tsx
if (gameState.game_mode === 'NEW_MODE') {
  return <NewMode {...props} />;
}
```

**Step 6: Add to Lobby**
```typescript
// frontend/src/components/lobby/GameLobby.tsx
const modes = [
  // ... existing modes
  {
    id: 'NEW_MODE',
    name: 'New Mode',
    description: 'Description of new mode',
    icon: '🎮',
  },
];
```

---

### Adding a New WebSocket Message Type

**Step 1: Define Message Type**
```go
// backend/internal/domain/messages.go
const (
    MessageTypeNewFeature = "new_feature"
)
```

**Step 2: Create Handler**
```go
// backend/internal/ws/handlers.go
func (r *Room) HandleNewFeature(client *Client, payload interface{}) {
    // Process message
    data := payload.(map[string]interface{})
    
    // Update state
    // ...
    
    // Broadcast to all clients
    r.BroadcastMessage("new_feature_response", response)
}
```

**Step 3: Add to Message Router**
```go
// backend/internal/ws/client.go (ReadPump)
case "new_feature":
    client.Room.HandleNewFeature(client, message.Payload)
```

**Step 4: Handle in Frontend**
```typescript
// frontend/src/hooks/useWebSocket.ts
useEffect(() => {
  if (!ws) return;
  
  const handleMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'new_feature_response') {
      // Handle response
    }
  };
  
  ws.addEventListener('message', handleMessage);
  return () => ws.removeEventListener('message', handleMessage);
}, [ws]);
```

---

### Modifying UI Layout

**To change game layout:**
1. Edit `frontend/src/components/WorldMapLayout.tsx` or `QuizModeLayout.tsx`
2. Modify Tailwind classes for spacing/sizing
3. Test on desktop and mobile viewports

**To add new UI component:**
1. Create component in `frontend/src/components/`
2. Export from component file
3. Import in parent component
4. Add props interface with TypeScript

**Example:**
```typescript
// frontend/src/components/NewComponent.tsx
interface NewComponentProps {
  data: string;
  onAction: () => void;
}

export const NewComponent = ({ data, onAction }: NewComponentProps) => {
  return (
    <div className="p-4 rounded-lg bg-card">
      <p>{data}</p>
      <button onClick={onAction}>Action</button>
    </div>
  );
};
```

---

## 🧪 Testing

### Frontend Tests

**Run tests:**
```bash
cd frontend
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

**Test structure:**
```
frontend/src/
├── hooks/__tests__/
│   ├── usePlayers.test.ts
│   └── useGameModals.test.ts
└── components/__tests__/
    ├── GameOverModal.test.tsx
    ├── LoadingSpinner.test.tsx
    └── GameBanners.test.tsx
```

**Writing a new test:**
```typescript
// frontend/src/components/__tests__/NewComponent.test.tsx
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  it('should render correctly', () => {
    render(<NewComponent data="test" onAction={() => {}} />);
    expect(screen.getByText('test')).toBeTruthy();
  });
});
```

### Backend Tests

**Run tests:**
```bash
cd backend
make test-unit          # Backend only
make test               # Backend + Frontend
```

**Writing a new test:**
```go
// backend/internal/game/question_test.go
func TestGenerateQuestion(t *testing.T) {
    countries := LoadCountries()
    question := GenerateQuestion("FLAG", countries)
    
    if question == nil {
        t.Error("Expected question, got nil")
    }
}
```

---

## 🚀 Deployment

### Local Development

```bash
# Backend
cd backend
make dev                # Hot reload with Air

# Frontend
cd frontend
npm run dev             # Vite dev server
```

### Production Build

```bash
# Build everything
cd backend
make build-all          # Builds frontend + backend

# Run production
make run                # Runs compiled binary
```

### Docker

```bash
cd backend

# Build image
make docker-build

# Run container
make docker-run

# Or use docker-compose
make docker-up
make docker-down
```

### Environment Variables

**Backend (.env):**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=briworld
DB_PASSWORD=password
DB_NAME=briworld_db
DB_SSL_MODE=disable

# Server
PORT=8080
ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=86400

# Redis
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

---

## 💡 Developer Tips

### Debugging WebSocket Issues

**Problem:** Messages not received
**Solution:** Check WebSocket connection status
```typescript
console.log('[WS] Connected:', isConnected);
console.log('[WS] State:', ws?.readyState);
```

**Problem:** Duplicate event handlers
**Solution:** Ensure cleanup in useEffect
```typescript
useEffect(() => {
  const handler = (event) => { /* ... */ };
  ws.addEventListener('message', handler);
  return () => ws.removeEventListener('message', handler);
}, [ws]);
```

### Debugging Game State

**Add logging:**
```go
// backend/internal/ws/room.go
log.Printf("[ROOM %s] Current state: %+v", r.ID, r.GameState)
```

```typescript
// frontend/src/pages/Game.tsx
console.log('[GAME] State:', gameState);
console.log('[GAME] Room:', roomUpdate);
```

### Performance Optimization

**Frontend:**
- Use `useMemo` for expensive computations
- Use `useCallback` for stable function references
- Avoid unnecessary re-renders with `React.memo`

**Backend:**
- Use goroutines for concurrent operations
- Implement connection pooling
- Cache frequently accessed data in Redis

### Common Pitfalls

**❌ Don't:**
- Modify state directly (use setState)
- Forget to clean up event listeners
- Block the main goroutine
- Store sensitive data in localStorage

**✅ Do:**
- Use TypeScript for type safety
- Add error handling
- Write tests for critical paths
- Document complex logic

---

## 📊 Project Metrics

### Frontend
- **Game.tsx:** 374 lines (reduced from 1047, -64%)
- **Custom Hooks:** 10 total (7 new)
- **Components:** 6 reusable
- **Tests:** 17 passing (5 test suites)

### Backend
- **Language:** Go 1.25
- **Framework:** Fiber v2
- **Database:** PostgreSQL (Neon)
- **Cache:** Redis (Upstash)
- **WebSocket:** gorilla/websocket

---

## 🎯 Quick Reference

### File Locations

**Want to modify game UI?**
→ `frontend/src/pages/Game.tsx`
→ `frontend/src/components/WorldMapLayout.tsx`
→ `frontend/src/components/QuizModeLayout.tsx`

**Want to modify WebSocket logic?**
→ `frontend/src/hooks/useWebSocket.ts`
→ `backend/internal/ws/hub.go`
→ `backend/internal/ws/room.go`

**Want to modify game rules?**
→ `backend/internal/ws/room.go`
→ `backend/internal/game/question.go`

**Want to add a new mode?**
→ `backend/internal/game/question.go` (question generation)
→ `frontend/src/modes/ModeRenderer.tsx` (UI rendering)
→ `frontend/src/components/lobby/GameLobby.tsx` (lobby entry)

**Want to modify authentication?**
→ `backend/internal/handlers/auth.go`
→ `backend/internal/middleware/auth.go`
→ `backend/internal/services/auth.go`

**Want to modify database models?**
→ `backend/internal/models/`

---

## 🎉 Summary

BriWorld is a well-architected, production-ready multiplayer game with:
- ✅ Clean separation of concerns
- ✅ Comprehensive testing
- ✅ Real-time WebSocket communication
- ✅ Scalable architecture
- ✅ Full TypeScript type safety
- ✅ Docker deployment ready

**For questions or contributions, refer to this guide and the codebase comments.**

---

*Last Updated: 2024*
*Version: 2.0*
*Status: Production Ready*
