# BriWorld

Real-time multiplayer geography game built with Go, Fiber, WebSocket, React, and TypeScript.

BriWorld is structured as a server-authoritative game platform:
- the backend owns rooms, rounds, questions, timers, scores, reconnection state, and multiplayer broadcasts
- the frontend renders that state, collects player input, and keeps the UI responsive across desktop, tablet, and mobile

## Current Status

The project currently exposes 5 active game modes in the main game-mode selection flow:
- `FLAG`
- `WORLD_MAP`
- `SILHOUETTE`
- `LAST_STANDING`
- `BORDER_LOGIC`

The codebase still contains work-in-progress or temporarily disabled modes such as `EMOJI`, `CAPITAL_RUSH`, `TEAM_BATTLE`, and `AUDIO`. They are intentionally kept in the repository for future reuse, but they are not part of the current main player flow.

## Product Overview

### Room Types
- `SINGLE`: one-player practice or solo game loop
- `PRIVATE`: invite-only room via room code
- `PUBLIC`: open matchmaking-style room

### Core Features
- real-time multiplayer synchronization over WebSocket
- server-authoritative scoring and round progression
- reconnect-aware sessions with room snapshot recovery
- interactive world map rendering
- chat and leaderboard support during multiplayer games
- responsive UI for desktop, tablet, and mobile
- account system with profile, auth, and stats support

## Architecture

### High-Level Layout

```text
frontend (React + TypeScript)
    |
    | HTTP: auth, rooms, profile, metadata
    | WebSocket: live game state and player actions
    v
backend (Go + Fiber + WebSocket)
    |
    | database persistence
    | cache / session state
    v
PostgreSQL + Redis
```

### Backend Responsibilities
- create and manage rooms
- validate joins and room mode compatibility
- generate questions for active game modes
- run game lifecycle transitions such as waiting, in progress, completed
- track scores, answers, map paints, eliminations, and ownership
- broadcast authoritative room snapshots to every player
- handle reconnection and session continuity

### Frontend Responsibilities
- collect lobby configuration and navigation state
- connect to the correct backend WebSocket endpoint
- render room updates, question UI, world map state, chat, and leaderboard
- store minimal session data locally so refresh/re-entry can recover
- adapt the same game state to desktop and mobile layouts

## Repository Structure

```text
BriWorld/
├── backend/
│   ├── cmd/server/              # application entrypoint
│   ├── internal/bootstrap/      # app wiring, middleware, startup
│   ├── internal/config/         # env/config loading
│   ├── internal/database/       # DB setup, migrations, queries
│   ├── internal/game/           # game modes, loaders, question generation
│   ├── internal/handlers/       # REST handlers
│   ├── internal/http/           # route registration
│   ├── internal/middleware/     # auth and request middleware
│   ├── internal/models/         # persistence models
│   ├── internal/redis/          # cache/session setup
│   ├── internal/services/       # service layer
│   ├── internal/utils/          # shared helpers
│   └── internal/ws/             # real-time room and multiplayer system
├── frontend/
│   ├── src/components/          # UI building blocks
│   ├── src/components/lobby/    # lobby-specific UI
│   ├── src/constants/           # game mode config and constants
│   ├── src/contexts/            # React context providers
│   ├── src/hooks/               # websocket, game, chat, player hooks
│   ├── src/lib/                 # api client and shared utilities
│   ├── src/modes/               # mode-specific renderers
│   ├── src/pages/               # route pages
│   └── src/types/               # frontend contracts
├── README.md
└── UNDERSTANDING_BRIWORLD.md
```

## Game Flow

### 1. Lobby
- player picks a mode and room type
- frontend stores the minimal config in session storage
- for single-player, the frontend requests a room from the backend

### 2. WebSocket Connection
- frontend connects with room code, username, session, mode, room type, rounds, and timeout
- backend validates the request and either joins an existing room or creates one
- backend sends `room_joined`, `room_update`, and `state_snapshot`

### 3. Round Lifecycle
- room owner or auto-start logic triggers game start
- backend generates a question
- backend controls timers and state transitions
- players answer or interact
- backend updates scores and broadcasts snapshots

### 4. Completion / Reconnect
- final results are broadcast when a game ends
- reconnecting players can restore room state from the server snapshot path

## Current Frontend Runtime

### Main Pages
- `/`: landing page
- `/lobby`: game mode and room selection
- `/game`: active gameplay shell
- `/waiting-room`: multiplayer pre-start screen
- `/about`: product and stack overview

### Important Frontend Modules
- `src/hooks/useWebSocket.ts`: websocket connection, message handling, reconnect logic
- `src/pages/Game.tsx`: main runtime page that composes the game shell
- `src/components/lobby/GameLobby.tsx`: room and mode selection UI
- `src/components/QuizModeLayout.tsx`: shared multiplayer layout for quiz-style modes
- `src/components/WorldMapLayout.tsx`: map-mode layout
- `src/components/MobileMultiplayerPanels.tsx`: mobile chat and leaderboard access

## Current Backend Runtime

### Important Backend Modules
- `backend/cmd/server/main.go`: process entrypoint
- `backend/internal/bootstrap`: app wiring and startup sequence
- `backend/internal/http`: REST route registration
- `backend/internal/ws`: websocket room system and broadcasts
- `backend/internal/game`: question generation and mode data
- `backend/internal/services`: business logic around auth, profile, rooms, metadata

### WebSocket System

The websocket layer is the multiplayer core of BriWorld.

Key ideas:
- each room owns its own client registry and game state
- broadcasts are message-based
- snapshots are used so reconnecting or newly joined clients receive a full state view
- the server is authoritative for room ownership, scores, timers, and room progression

Common message categories:
- join / leave
- room updates
- game start / round start / round end
- chat
- answer submission
- map paint submission
- state snapshot

## Environment

### Backend

Common backend environment variables:

```env
PORT=8080
ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=briworld
DB_PASSWORD=your_password
DB_NAME=briworld_db
DB_SSL_MODE=disable

JWT_SECRET=change-me

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@briworld.com
```

### Frontend

Recommended local frontend environment:

```env
VITE_API_URL=http://localhost:8080/api/v2
VITE_WS_URL=ws://localhost:8080/ws
```

Notes:
- if `VITE_WS_URL` is not set, the frontend derives the websocket URL from `VITE_API_URL`
- in dev, this avoids accidental websocket attempts against the Vite server on port `5173`

## Local Development

### Backend

```bash
cd backend
go test ./...
go run ./cmd/server
```

### Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
npm run dev
```

### Typical Local Setup

Run backend on `http://localhost:8080` and frontend on `http://localhost:5173`.

## Quality Gates

These are the practical quality checks for this repository:
- `cd backend && go test ./...`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

If all three are green, the repo is usually in a safe working state for feature work.

## Active Mode Summary

### `FLAG`
- timed guess-the-flag gameplay
- server-scored rounds

### `WORLD_MAP`
- multiplayer map painting
- shared room state, colors, and leaderboard

### `SILHOUETTE`
- country outline guessing
- backend-generated silhouette data, frontend-rendered SVG

### `LAST_STANDING`
- elimination-based pressure mode

### `BORDER_LOGIC`
- country-neighbor deduction mode

## Documentation

For the full architecture walkthrough, read [UNDERSTANDING_BRIWORLD.md](./UNDERSTANDING_BRIWORLD.md).

That document explains:
- backend startup and module boundaries
- websocket room architecture
- frontend state flow
- how room sync works
- where to add a new game mode
- operational and maintenance guidance
