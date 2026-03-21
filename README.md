# BriWorld

BriWorld is a real-time, server-authoritative geography game built with Go on the backend and React on the frontend. Players can practice solo, open public rooms, or play in private rooms while the backend owns the room state, timers, scoring, round progression, and reconnection flow.

The current codebase is broader than the currently shipped player flow. This README reflects the repository as it exists now, not every experiment or disabled path that still lives in source.

## What BriWorld Does

- Runs live multiplayer geography games over WebSocket
- Supports solo and room-based play
- Persists user accounts, stats, ranks, profile media, and profile customization
- Serves a modern responsive frontend with profile avatar/banner editing and animated decoration support
- Combines PostgreSQL for durable data with Redis-backed runtime support

## Current Product Surface

### Active Game Modes

These are the modes currently exposed in the main frontend selection flow and supported by the live join/runtime path:

- `FLAG`
- `WORLD_MAP`
- `SILHOUETTE`
- `LAST_STANDING`
- `BORDER_LOGIC`

### Present In Code, But Not Fully Live

The repository still contains mode and feature code that is disabled, incomplete, or intentionally not exposed in the main flow:

- `EMOJI`
- `CAPITAL_RUSH`
- `TEAM_BATTLE`
- `AUDIO`

Do not assume a mode is production-ready just because backend generators or constants exist for it. The active frontend mode list and the WebSocket join validation are the real source of truth.

## Architecture At A Glance

```text
React + TypeScript frontend
  -> REST for auth, profile, leaderboard, meta, uploads, room setup
  -> WebSocket for live gameplay

Go + Fiber backend
  -> room lifecycle
  -> authoritative state mutation
  -> question generation
  -> scoring, timers, reconnects, broadcasts

PostgreSQL + Redis + static assets/uploads
```

### Backend Responsibilities

- Boot the Fiber application and infrastructure
- Load static geography/game data
- Register HTTP and WebSocket routes
- Own room state, player state, timers, and scoring
- Generate questions for supported modes
- Persist users, stats, achievements, profile media metadata, and customization

### Frontend Responsibilities

- Handle navigation, forms, and account flows
- Create or join rooms
- Connect to the gameplay WebSocket
- Render server-driven room/game state
- Manage profile editing, avatar/banner uploads, and decoration previews
- Adapt the experience across desktop, tablet, and mobile

## Tech Stack

### Backend

- Go `1.25`
- Fiber `v2`
- Fiber WebSocket
- GORM + PostgreSQL
- `pgx`
- Redis `v9`
- JWT auth
- Cloudinary support for media uploads, with local upload fallback in development

### Frontend

- React `18`
- TypeScript
- Vite `5`
- React Router `6`
- TanStack Query `5`
- Tailwind CSS
- Radix UI
- Framer Motion
- GSAP
- Lottie Web

## Repository Layout

```text
BriWorld/
├── backend/
│   ├── cmd/server/              # backend entrypoint
│   ├── internal/bootstrap/      # app construction and startup
│   ├── internal/config/         # env/config loading
│   ├── internal/database/       # DB setup and migrations
│   ├── internal/game/           # mode config, loaders, question generation
│   ├── internal/handlers/       # HTTP handlers
│   ├── internal/http/           # route registration
│   ├── internal/middleware/     # auth and request middleware
│   ├── internal/models/         # DB models
│   ├── internal/services/       # auth/profile/meta services
│   ├── internal/ws/             # multiplayer room runtime
│   └── static/                  # game data and generated assets
├── frontend/
│   ├── src/components/          # UI components and editors
│   ├── src/constants/           # game mode and profile decoration config
│   ├── src/contexts/            # theme and shared providers
│   ├── src/hooks/               # websocket/game/player/chat hooks
│   ├── src/lib/                 # API client and helpers
│   ├── src/modes/               # mode-specific UI renderers
│   ├── src/pages/               # route pages
│   └── src/types/               # shared frontend contracts
├── README.md
└── UNDERSTANDING_BRIWORLD.md
```

## Runtime Flow

### 1. Account And Lobby Setup

- The frontend handles auth and profile setup over REST
- A player chooses a mode and room type in the lobby
- For solo play, the frontend can request room creation before gameplay

### 2. WebSocket Join

The frontend opens `/ws` with room and player context in query params, including:

- room code
- username
- session id
- mode
- room type
- rounds
- timeout
- auth token when available

The backend validates the request, checks mode compatibility, restores reconnect state when possible, and attaches the player to the authoritative room runtime.

### 3. Server-Authoritative Gameplay

- The backend starts rounds and timers
- Players submit answers, paints, and chat messages
- The backend validates and mutates state
- Updated room or snapshot messages are broadcast to all connected clients

### 4. Reconnect And Recovery

Room snapshots are stored server-side so players can recover a room after refresh or connection loss. The frontend also keeps minimal local session context so it can reconnect cleanly.

## Frontend Routes

Current routes visible in `frontend/src/App.tsx` include:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/about`
- `/lobby`
- `/profile`
- `/leaderboard`
- `/waiting`
- `/game`
- `/settings`

## Backend Surface

Important runtime routes and systems currently include:

- `GET /api/v2/health`
- auth routes for register, login, refresh, forgot-password, reset-password
- profile routes for profile data and customization
- avatar, banner, avatar-decoration upload/delete routes
- profile asset library routes at `/api/v2/user/profile-assets`
- achievements, rank, mastery, and daily challenge routes
- leaderboard and season routes
- WebSocket gameplay route at `/ws`

The backend also serves:

- built frontend assets from `./web-dist`
- static assets from `/static`
- music assets from `/Music`
- locally uploaded media from `/uploads`

## Profile And Media System

The profile page currently supports:

- username editing
- animated avatar uploads, including GIF avatars
- banner uploads for image, GIF, and Lottie JSON
- saved banner transform settings for scale and positioning
- animated avatar decoration presets
- custom avatar decoration uploads
- stat cards for points, wins, games, streaks, and countries mastered

Media uploads use Cloudinary when configured. If Cloudinary is unavailable, the backend falls back to local file storage under `/uploads`, which is proxied by Vite during development.

## Local Development

### Prerequisites

- Go
- Node.js and npm
- PostgreSQL
- Redis

### Backend Setup

```bash
cd backend
cp .env.example .env
go test ./...
go run ./cmd/server
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run build
npm run dev
```

### Default Local URLs

- frontend: `http://localhost:5173`
- backend: `http://localhost:8080`
- API via Vite proxy: `/api`
- WebSocket via Vite proxy: `/ws`

The Vite dev server also proxies `/uploads` so locally stored avatar, banner, and decoration media resolve correctly in development.

## Environment Notes

### Backend

See `backend/.env.example` for the current baseline. The main categories are:

- database
- server and CORS
- JWT
- Redis
- SMTP
- Cloudinary
- game defaults

### Frontend

See `frontend/.env.example` for the current baseline. The main variables are:

- `VITE_API_URL`
- `VITE_WS_URL`
- app metadata
- feature flags
- default room settings
- audio flags

## Useful Commands

### Backend

```bash
cd backend
make dev
make build
make test-unit
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm test
```

## Quality Checks

These are the practical checks that match the current repo setup:

```bash
cd backend && go test ./...
cd frontend && npm run build
```

`npm run lint` may also be useful during frontend work if you are touching UI code.

## Read Next

- [UNDERSTANDING_BRIWORLD.md](https://github.com/Flack74/BriWorld/blob/main/UNDERSTANDING_BRIWORLD.md)
- [backend/README.md](https://github.com/Flack74/BriWorld/blob/main/backend/README.md)


<div align="center">
⭐ Star this repo if you find it useful!  
Built with ❤️ by Flack
</div>
