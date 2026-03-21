# Understanding BriWorld

This document explains how BriWorld is put together, how the important runtime paths work, and where to make changes without breaking room sync or game flow.

The goal is readability first. This is not a dump of every file. It is a map of the system.

## 1. Mental Model

BriWorld is a real-time, server-authoritative geography game.

That means:
- the backend is the source of truth for rooms, players, rounds, scores, and live multiplayer state
- the frontend is a rendering and interaction client
- clients send intents such as `start_game`, `answer`, `paint_country`, or `chat`
- the server validates the action, mutates room state, and broadcasts the updated snapshot

This model matters because it keeps multiplayer behavior consistent:
- every player sees the same room state
- reconnecting players can recover from the backend snapshot
- scores and progression are harder to desync or spoof client-side

## 2. System Shape

```text
React UI
  -> REST for setup and account features
  -> WebSocket for live gameplay

Go backend
  -> Room lifecycle
  -> Question generation
  -> Authoritative timers and scoring
  -> Broadcast snapshots

Persistence
  -> PostgreSQL for durable user/application data
  -> Redis for ephemeral session/reconnect support
```

## 3. Current Active Product Surface

At the time of this document, the main playable mode selection exposes 5 active modes:
- `FLAG`
- `WORLD_MAP`
- `SILHOUETTE`
- `LAST_STANDING`
- `BORDER_LOGIC`

The repository still contains additional mode code, especially `EMOJI`, plus some unfinished or disabled paths such as `CAPITAL_RUSH`, `TEAM_BATTLE`, and `AUDIO`.

Important rule:
- code present in the repo is not automatically a supported player-facing feature
- always check the active frontend mode config and websocket join rules before assuming a mode is live

## 4. Backend Architecture

### 4.1 Entry Point

File:
- [main.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/cmd/server/main.go)

What it does:
- loads `.env` in development
- builds the application through the bootstrap package
- starts the server
- waits for shutdown signals

This file should stay thin. If complex boot logic is added here, it becomes hard to test and reason about.

### 4.2 Bootstrap Layer

Directory:
- `backend/internal/bootstrap`

Responsibility:
- initialize config
- connect infrastructure such as database, redis, mailer
- create the Fiber app
- register middleware and HTTP routes
- own process startup and shutdown concerns

This is the composition root of the backend.

### 4.3 Config Layer

Directory:
- `backend/internal/config`

Responsibility:
- read environment variables
- normalize defaults for development and production
- centralize config structs

This layer should be the only place that knows raw env keys in detail.

### 4.4 Database and Persistence

Directories:
- `backend/internal/database`
- `backend/internal/models`

Responsibilities:
- open PostgreSQL connections
- manage migrations and database bootstrapping
- define persistent models such as users, stats, achievements, and challenge-related data

Use this layer for durable data. Do not treat websocket room memory as the place for permanent user state.

### 4.5 Services Layer

Directory:
- `backend/internal/services`

Responsibilities:
- business logic for auth, profile, meta, and other application features
- coordination between handlers and persistence

The service layer is where non-trivial REST/business flows should live.

### 4.6 HTTP Layer

Directories:
- `backend/internal/http`
- `backend/internal/handlers`
- `backend/internal/middleware`

Responsibilities:
- define routes
- parse requests
- call services
- return HTTP responses
- enforce auth/authorization where needed

This layer should stay transport-focused. It should not absorb room logic that belongs in websocket/game packages.

### 4.7 Game Engine Layer

Directory:
- `backend/internal/game`

Responsibilities:
- game mode types
- question generation
- country data loading
- silhouette loading and fallback data
- fuzzy answer behavior and mode-specific question setup

This package is the content and rules source for mode generation. It does not own websocket transport, but its outputs feed websocket gameplay.

Important examples:
- silhouette mode depends on backend-generated outline data in `backend/static/silhouettes.json`
- loaders resolve static data robustly so running from different working directories still works
- question generation decides what the next round looks like

### 4.8 WebSocket Multiplayer Layer

Directory:
- `backend/internal/ws`

This is the most important runtime package in BriWorld.

It owns:
- room creation and lookup
- room state mutation
- join and leave handling
- reconnection behavior
- round progression
- score updates
- world map painting
- broadcasting authoritative state to clients

If multiplayer behavior is wrong, this package is usually the first place to inspect.

## 5. WebSocket Architecture

### 5.1 Why It Exists

REST works well for:
- auth
- profile
- room creation
- metadata

It is a poor fit for:
- per-round timers
- live room membership
- immediate score updates
- chat
- map painting
- reconnect-aware room sync

That is why gameplay moves through WebSocket.

### 5.2 Connection Flow

The frontend opens a websocket with query params that include:
- room code
- username
- session id
- game mode
- room type
- rounds
- timeout
- token when available

The backend handler:
1. validates required values
2. rejects unsupported or disabled modes
3. validates mode compatibility with an existing room
4. creates or loads the room
5. restores room state if this is a reconnect path
6. registers the client and starts read/write pumps

The handler file to know first:
- [handlers.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/ws/handlers.go)

### 5.3 Room as the Unit of Multiplayer

A room represents one live multiplayer context:
- members
- owner
- mode
- room type
- scores
- current question
- timers
- answered state
- painted countries
- player colors
- elimination state

That room state must be safe to read and mutate concurrently.

### 5.4 Broadcast Strategy

BriWorld uses two broad types of websocket updates:

Small event messages:
- player joined
- chat message
- game started
- round started
- answer result

Authoritative snapshots:
- full room/game state used to resync clients

The key helper is in:
- [room_broadcast.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/ws/room_broadcast.go)

Why snapshots matter:
- reconnecting clients need a full state view
- newly joined clients should not reconstruct the room by replaying a long event history
- snapshot-based sync reduces drift between clients

### 5.5 Room State Safety

Patterns already important in this repo:
- clone maps before broadcasting
- avoid holding room locks while calling routines that reacquire state
- guard nil question access
- treat backend state as authoritative

Common failure modes if this discipline slips:
- deadlocks
- stale scores
- one-round-late UI behavior
- clients seeing different map or leaderboard state

## 6. Frontend Architecture

### 6.1 Frontend Role

The frontend is not the game engine.

Its job is to:
- connect
- render
- collect intent
- recover local session context
- keep UI usable across screen sizes

This division is important. If the frontend starts inventing scores, winners, round state, or room truth independently, multiplayer consistency breaks.

### 6.2 Main Frontend Entry Paths

Relevant pages:
- `src/pages/Lobby.tsx`
- `src/pages/Game.tsx`
- `src/pages/WaitingRoom.tsx`
- `src/pages/About.tsx`

`Game.tsx` is the runtime shell for active play.

It composes:
- websocket connectivity
- game-state helpers
- player state helpers
- chat handling
- banners and modals
- map or quiz layouts

Primary file:
- [Game.tsx](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/pages/Game.tsx)

### 6.3 Hook-Based State Organization

The frontend relies heavily on hooks to keep responsibilities separated.

Important hooks:
- `useWebSocket`: connection lifecycle, incoming messages, outgoing actions
- `useGameState`: UI state derived from backend game state
- `usePlayers`: leaderboard/player representation
- `useChatMessages`: chat formatting and message state
- `useGameAutoStart`: single-player and owner auto-start behavior
- `useColorManagement`: player color UI flow

This is good architecture when hook boundaries stay clear and payload typing stays strict.

### 6.4 Rendering Layers

The active game screen is rendered through shared layouts:
- quiz-style layouts
- world-map layout
- mobile multiplayer panels for chat and leaderboard

That split exists because world map gameplay has a different interaction surface from text/option-based round modes.

## 7. Frontend Networking Model

### 7.1 REST

REST is used for:
- auth
- profile
- room creation
- password reset flows
- other standard app operations

### 7.2 WebSocket

`useWebSocket.ts` is the live game transport client.

Responsibilities:
- build the websocket URL
- open/close/reconnect the connection
- parse messages
- update game and room state
- expose actions like `sendAnswer`, `startGame`, `sendChatMessage`, and `sendPaintCountry`

Important implementation detail:
- in development, the websocket URL should resolve to the backend, not the Vite server
- the frontend now prefers `VITE_WS_URL`, then derives from `VITE_API_URL`, then falls back only as a last resort

## 8. Room Sync Model

This is the most important behavior to preserve during refactors.

### Principle

Every player in the same room should observe the same authoritative game state.

That includes:
- status
- round number
- question
- scores
- player list
- owner
- chat
- colors
- painted countries
- elimination state

### How BriWorld Does It

The backend now broadcasts state snapshots at important transition points such as:
- join
- start game
- round start
- room updates
- score changes
- map painting
- round end
- completion

This is what keeps public and private rooms in sync.

### Why This Matters

Without snapshot discipline:
- public room joins can lag behind current room state
- reconnecting players can land on stale UI
- world map can feel local-only instead of shared
- players can get stuck in “waiting for room to start”

## 9. Reconnection Model

Reconnection in BriWorld is not just “try the socket again”.

A useful reconnect path requires:
- persistent session identity
- room lookup by session
- room snapshot restore
- frontend ability to recover room code and config
- backend willingness to treat the session as a returning player

Current approach:
- frontend stores minimal config in session storage
- backend tracks room/session state
- snapshots are sent again when the player reconnects

This is the correct direction for production multiplayer because it treats reconnect as state recovery, not a brand-new join.

## 10. Current Active Modes

### `FLAG`

Shape:
- timed question mode
- standard text answer submission

Backend concerns:
- question generation
- fuzzy answer matching
- scoring based on timing/game rules

Frontend concerns:
- render flag clue
- timer display
- input UX and success/error feedback

### `WORLD_MAP`

Shape:
- map interaction mode
- players paint countries on the shared map

Backend concerns:
- validate paint attempts
- track painted countries globally for the room
- maintain player colors and shared scores

Frontend concerns:
- interactive world map rendering
- stable player color presentation
- shared leaderboard and map state

### `SILHOUETTE`

Shape:
- backend provides silhouette path data
- frontend renders the outline and answer UI

Backend concerns:
- provide real silhouette data, not placeholders
- load silhouette assets robustly
- generate mode questions correctly

Frontend concerns:
- scale/normalize the backend path to the display box
- avoid treating silhouette payloads like image URLs

### `LAST_STANDING`

Shape:
- elimination-based round system

Backend concerns:
- elimination bookkeeping
- winner resolution
- active-player tracking

Frontend concerns:
- clear elimination state
- correct room-wide results and transitions

### `BORDER_LOGIC`

Shape:
- deduction mode based on country neighbors

Backend concerns:
- neighbor data integrity
- question generation

Frontend concerns:
- readable prompt and answer UX

## 11. Disabled or Future Modes

The codebase contains disabled or future mode paths.

Current expectation:
- keep the code if it is useful for later
- hide it from the lobby and main selection config
- reject unsupported live mode joins at the websocket boundary

This is better than deleting code impulsively or leaving half-enabled modes visible to users.

## 12. Important Data Files

Key static data lives under backend assets such as:
- world/country metadata
- borders
- capitals
- silhouettes

The silhouette pipeline deserves special mention:
- silhouette data is generated on the backend
- runtime loads `backend/static/silhouettes.json`
- there is also a generated Go fallback data file

If silhouette rendering looks wrong, the issue can be in either:
- the generated silhouette data itself
- the frontend normalization/rendering logic

## 13. Development Workflow

### Recommended Loop

1. run backend tests
2. run frontend lint
3. run frontend build
4. verify the specific mode or room flow manually

Commands:

```bash
cd backend && go test ./...
cd frontend && npm run lint
cd frontend && npm run build
```

### Why This Order

- backend tests catch websocket and game-state regressions
- frontend lint catches payload, hook, and typing mistakes
- frontend build confirms the app still compiles cleanly

## 14. Environment Model

### Backend

Typical backend env:

```env
PORT=8080
ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=briworld
DB_PASSWORD=password
DB_NAME=briworld_db
DB_SSL_MODE=disable

JWT_SECRET=your-secret-key

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false
```

### Frontend

Typical frontend env:

```env
VITE_API_URL=http://localhost:8080/api/v2
VITE_WS_URL=ws://localhost:8080/ws
```

Important:
- `VITE_API_URL` should include `/api/v2` for the current frontend API helpers
- if `VITE_WS_URL` is omitted, websocket resolution should still derive correctly from `VITE_API_URL`

## 15. How to Add or Re-enable a Mode Safely

Do not just add a page and a title string.

A proper mode change touches multiple layers:

1. backend game generation
2. websocket room progression
3. frontend mode selection config
4. frontend renderer/layout path
5. tests and manual verification

Checklist:
- define or re-enable the backend mode constant
- ensure question generation supports it
- confirm room/game logic supports it
- expose it in frontend mode config
- ensure `Game.tsx` and mode renderer can display it
- verify mobile layout
- verify single, private, and public room behavior
- verify reconnect behavior

## 16. Safe Refactor Rules

When working in BriWorld, these rules prevent the most common regressions:

- do not let the frontend become the source of truth for multiplayer state
- do not broadcast shared room maps directly without cloning mutable maps first
- do not hold locks while calling helpers that reacquire room state
- do not trust old session storage blindly without backend verification
- do not expose disabled modes only by accident of stale config
- do not assume single-player fixes automatically work in private/public rooms

## 17. Where to Look First When Something Breaks

### “Room not syncing”
Start with:
- `backend/internal/ws`
- `frontend/src/hooks/useWebSocket.ts`

### “Mode visible but should not be playable”
Start with:
- `frontend/src/constants/gameModes.ts`
- websocket join validation in `backend/internal/ws/handlers.go`

### “Map actions sent but not visible to other players”
Start with:
- map paint handler in websocket room logic
- snapshot broadcast path
- frontend room state application

### “Silhouette looks wrong”
Start with:
- backend silhouette data generation
- backend silhouette loader
- frontend silhouette renderer normalization/scaling

### “Refresh dumps player out of the game”
Start with:
- frontend session storage recovery
- backend reconnection/session lookup
- snapshot restoration path

## 18. What “Production Grade” Means Here

For BriWorld, production grade does not mean “more abstractions”.

It means:
- deterministic room behavior
- reliable reconnect flow
- typed frontend contracts
- snapshot-based multiplayer sync
- clear boundaries between REST, websocket, and game logic
- build/test/lint staying green
- modes either fully supported or explicitly disabled

That is the standard to hold changes against.

## 19. Final Orientation

If you are new to the codebase, start here:

1. `backend/cmd/server/main.go`
2. `backend/internal/bootstrap`
3. `backend/internal/ws`
4. `backend/internal/game`
5. `frontend/src/pages/Game.tsx`
6. `frontend/src/hooks/useWebSocket.ts`
7. `frontend/src/components/lobby/GameLobby.tsx`

That path gives the fastest understanding of how the product works end to end.
