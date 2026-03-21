# Understanding BriWorld

This document is a working architecture guide for the current BriWorld codebase. It is meant to help a new engineer understand how the system actually behaves today, where the main runtime boundaries are, and which parts are authoritative when behavior seems unclear.

It is intentionally opinionated: when code presence and product reality differ, this guide favors the current runtime path over dormant or partially implemented code.

## 1. Mental Model

BriWorld is a server-authoritative, real-time geography game.

That means:

- the backend is the source of truth for rooms, players, timers, scores, questions, eliminations, and game progression
- the frontend is a rendering and interaction client
- clients send intents such as join, answer, paint, chat, or start-game
- the backend validates those intents, mutates room state, and broadcasts the result

This model is the core design constraint of the project. If a feature starts inventing gameplay truth on the client, multiplayer drift follows quickly.

## 2. System Shape

```text
React frontend
  -> REST for auth, profile, leaderboard, meta, uploads
  -> WebSocket for live gameplay

Go backend
  -> bootstraps app and infrastructure
  -> exposes HTTP and WebSocket routes
  -> owns room state and progression
  -> generates mode-specific questions

Persistence and support services
  -> PostgreSQL for durable data
  -> Redis for runtime/session support
  -> Cloudinary or local uploads for profile media
```

## 3. What Is Actually Live

The main player-facing mode selection currently exposes five active modes:

- `FLAG`
- `WORLD_MAP`
- `SILHOUETTE`
- `LAST_STANDING`
- `BORDER_LOGIC`

The repository also contains additional mode code and experiments, especially:

- `EMOJI`
- `CAPITAL_RUSH`
- `TEAM_BATTLE`
- `AUDIO`

Important nuance:

- some of these still exist in backend mode config or question generation
- that does not make them supported in the active product
- `EMOJI`, for example, still exists in parts of the backend but is explicitly rejected by the current WebSocket join path

When deciding whether something is live, check these first:

1. `frontend/src/constants/gameModes.ts`
2. `backend/internal/ws/handlers.go`

## 4. Backend Architecture

### 4.1 Entry Point

Primary file:

- [main.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/cmd/server/main.go)

This file stays intentionally thin. It hands off most real work to the bootstrap layer.

### 4.2 Bootstrap Layer

Primary file:

- [app.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/bootstrap/app.go)

This is the backend composition root. It currently does the following:

- loads runtime config
- initializes the database
- runs essential migration checks, including profile customization schema work
- initializes Redis and mail infrastructure
- loads static game data
- creates the Fiber app
- attaches middleware such as recover, logger, and CORS
- registers HTTP and WebSocket routes
- starts background runtime tasks such as room-state cleanup and keepalive workers

This file is the correct place for startup wiring. Do not push application business logic into it.

### 4.3 Config And Environment

Directory:

- `backend/internal/config`

This layer converts environment variables into a usable application config. `backend/.env.example` shows the practical baseline categories:

- PostgreSQL
- server and CORS
- JWT
- Redis
- SMTP
- Cloudinary
- game defaults

### 4.4 Database And Persistence

Primary directories:

- `backend/internal/database`
- `backend/internal/models`

This layer handles:

- PostgreSQL connectivity
- migrations
- durable models for users, stats, achievements, and profile assets
- profile customization persistence

Rule of thumb:

- if data must survive process restarts, it belongs here
- if data only exists to keep live rooms running, it probably belongs in the WebSocket room runtime instead

### 4.5 Services

Primary directory:

- `backend/internal/services`

This layer is the bridge between transport handlers and persistence-oriented business logic. Auth, profile, and metadata workflows should be concentrated here rather than duplicated in handlers.

### 4.6 HTTP Layer

Primary directories:

- `backend/internal/http`
- `backend/internal/handlers`
- `backend/internal/middleware`

The HTTP layer owns:

- route registration
- request parsing
- auth checks
- response formatting
- transport-specific concerns

Current route registration lives in:

- [routes.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/http/routes.go)

The current route surface includes:

- auth routes
- profile routes
- avatar, banner, and avatar-decoration upload/delete routes
- profile asset library routes
- achievements, rank, mastery, and daily challenge routes
- leaderboard and season routes
- the gameplay WebSocket endpoint at `/ws`

The backend also serves:

- built frontend assets from `./web-dist`
- static game assets from `/static`
- music assets from `/Music`
- locally uploaded media from `/uploads`

### 4.7 Game Engine Layer

Primary directory:

- `backend/internal/game`

This package is responsible for:

- mode configuration
- question generation
- country and geography data loading
- silhouette support
- mode-specific content behavior

Files worth knowing:

- [mode_config.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/game/mode_config.go)
- [question_generator.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/game/question_generator.go)

One important distinction:

- this package defines content and question behavior
- it does not own live room state or client transport

### 4.8 WebSocket Multiplayer Layer

Primary directory:

- `backend/internal/ws`

This is the critical runtime package for gameplay. It owns:

- room creation and lookup
- room membership
- join/leave handling
- authoritative room state mutation
- timers and round progression
- scoring and elimination flow
- broadcast and snapshot behavior
- reconnect support

If a multiplayer bug affects state consistency, this package is the first place to inspect.

## 5. WebSocket Runtime

### 5.1 Connection Flow

The frontend connects to `/ws` with query parameters that include:

- room code
- username
- session id
- mode
- room type
- rounds
- timeout
- auth token when available

The main handler is:

- [handlers.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/ws/handlers.go)

That handler currently:

1. validates required join values
2. rejects unsupported or disabled modes
3. checks compatibility when joining an existing room
4. restores reconnect state when possible
5. resolves profile media information from the authenticated user context
6. attaches the client to the room runtime

### 5.2 Room As The Unit Of Truth

A room is the live multiplayer authority for:

- players
- ownership
- mode and room type
- round state
- current question
- timers
- answers
- scores
- map paints and colors
- elimination or survival state

The correctness of BriWorld depends on keeping these mutations on the server side.

### 5.3 Snapshots And Reconnection

The room runtime uses snapshot-style updates so reconnecting clients can recover quickly.

Primary file:

- [room_state.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/ws/room_state.go)

Current behavior from the code:

- room snapshots are kept in memory
- reconnect metadata is tracked server-side
- snapshot entries have a TTL around 30 minutes
- periodic cleanup runs in the background

Why this matters:

- refreshes do not have to rebuild state by replaying a long event stream
- reconnecting players can re-enter an active game more safely
- server truth stays centralized

## 6. Frontend Architecture

### 6.1 Frontend Role

The frontend is a client for the game engine, not the game engine itself.

Its job is to:

- collect setup inputs
- connect to REST and WebSocket endpoints
- render the room and question state
- keep session context stable across refreshes
- present mobile, tablet, and desktop layouts cleanly

### 6.2 Application Shell

Primary file:

- [App.tsx](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/App.tsx)

Current route map includes:

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

This means the product surface is broader than gameplay alone. Auth, profile customization, ranking, and settings are part of the app shell.

### 6.3 Gameplay Shell

Primary file:

- [Game.tsx](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/pages/Game.tsx)

`Game.tsx` is the runtime composition point for live play. It pulls together:

- WebSocket connectivity
- game-state derivation
- banners and modals
- player rendering
- color and map interaction
- chat
- auto-start behavior
- audio handling

This file is large because it orchestrates many concerns, but the actual logic is intentionally distributed across hooks.

### 6.4 Hook Boundaries

One of the healthier frontend patterns in this repo is the hook split around gameplay concerns.

Important hooks include:

- `useWebSocket`
- `useGameState`
- `usePlayers`
- `useChatMessages`
- `useGameAutoStart`
- `useColorManagement`
- `useAudioManager`

Primary WebSocket file:

- [useWebSocket.ts](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/hooks/useWebSocket.ts)

Current behavior from that hook:

- derives the WebSocket base URL from `VITE_WS_URL` or `VITE_API_URL`
- sends join parameters through the query string
- handles snapshot and round/game event messages
- supports reconnect-aware client behavior

## 7. Profile, Media, And Customization

The profile system has become a meaningful subsystem rather than a simple avatar field.

Primary files:

- [Profile.tsx](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/pages/Profile.tsx)
- [ProfileAvatar.tsx](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/components/ProfileAvatar.tsx)
- [ProfileDecorationOverlay.tsx](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/components/ProfileDecorationOverlay.tsx)
- [AvatarEditorDialog.tsx](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/components/AvatarEditorDialog.tsx)
- [BannerEditorDialog.tsx](/home/flack/Documents/Go_Projects/BriWorld-v2/frontend/src/components/BannerEditorDialog.tsx)
- [avatar_handler.go](/home/flack/Documents/Go_Projects/BriWorld-v2/backend/internal/handlers/avatar_handler.go)

### 7.1 Current Profile Features

The current profile page supports:

- editable username
- avatar uploads
- animated GIF avatars
- banner uploads for image, GIF, and Lottie JSON
- saved banner transform settings for scale and position
- avatar decoration presets
- custom avatar decoration uploads
- stat cards for points, wins, games, streaks, and countries mastered

### 7.2 Avatar Rendering

The avatar rendering path is now stricter than a simple `border-radius` image:

- avatar display is kept square and circular
- the avatar container uses an explicit mask strategy
- the decoration layer is separate from the avatar image layer
- decorations render as frames above the avatar rather than loose stickers

### 7.3 Decoration Behavior

The current decoration system supports:

- preset-driven animated effects
- custom uploaded PNG/GIF/Lottie avatar decorations
- layered rendering above the avatar
- GSAP-based animation for preset motion
- Lottie playback through the shared Lottie renderer when the asset type is JSON

### 7.4 Banner Editing

Banner editing no longer depends on a full customization studio. The current flow is:

- upload a banner
- open the banner editor
- adjust scale and offsets
- persist layout settings into profile customization JSON
- render those transforms directly in the profile header

This matters because GIF and Lottie banners stay animated. The editor stores transforms instead of flattening the media.

### 7.5 Media Upload Storage

The backend media handler currently supports:

- Cloudinary uploads when credentials are configured
- local file storage fallback when Cloudinary is unavailable
- profile asset metadata persistence in the database
- delete handling for both Cloudinary and local uploads

This fallback is important for local development because the profile asset library and media editing flows can work without Cloudinary.

## 8. Current Frontend/Backend Contract Notes

There are a few practical truths that matter when changing the product:

- the frontend trusts the backend for room truth
- the backend trusts persisted profile state for avatar/banner media URLs
- the frontend appends cache-busting version values to updated media URLs so avatar and banner changes rerender immediately
- locally stored uploads are reachable in frontend development because Vite proxies `/uploads`

These are small implementation details, but they explain why profile updates and reconnect flows work the way they do.

## 9. Development Setup

### 9.1 Backend

Typical local flow:

```bash
cd backend
cp .env.example .env
go test ./...
go run ./cmd/server
```

Useful Make targets from `backend/Makefile`:

- `make dev`
- `make build`
- `make test-unit`
- `make docker-up`

### 9.2 Frontend

Typical local flow:

```bash
cd frontend
cp .env.example .env
npm install
npm run build
npm run dev
```

### 9.3 Development Networking

Current Vite behavior from `frontend/vite.config.ts`:

- frontend runs on `5173`
- `/api` proxies to backend `8080`
- `/ws` proxies to backend WebSocket `8080`
- `/uploads` proxies to backend `8080`

That proxy setup is important for local media previews and for avoiding hardcoded cross-origin URLs during development.

## 10. Where To Look First

If you are debugging a specific kind of issue, start here:

- auth or route access: `backend/internal/http`, `backend/internal/middleware`, `frontend/src/lib/api.ts`
- gameplay sync bugs: `backend/internal/ws`
- question/mode issues: `backend/internal/game`
- room reconnect problems: `backend/internal/ws/room_state.go` and `frontend/src/hooks/useWebSocket.ts`
- profile media bugs: `backend/internal/handlers/avatar_handler.go` and `frontend/src/pages/Profile.tsx`
- avatar/banner rendering issues: `frontend/src/components/ProfileAvatar.tsx`, `frontend/src/components/ProfileDecorationOverlay.tsx`, `frontend/src/components/AvatarEditorDialog.tsx`, `frontend/src/components/BannerEditorDialog.tsx`

## 11. Practical Engineering Rules For This Repo

These are the rules implied by the current architecture:

- keep the backend authoritative for gameplay state
- do not infer “live feature” from dead or disabled code paths
- keep startup wiring in bootstrap, not in `main.go`
- keep transport logic in handlers and room logic in the WebSocket/game layers
- treat profile media as a full subsystem, not a small afterthought
- preserve reconnect behavior when touching room state or join flow

## 12. Summary

BriWorld today is best understood as three connected products:

- a real-time multiplayer geography engine
- a conventional account/profile web application
- a media-rich profile customization system layered onto that game account model

The backend room runtime is still the heart of the system. The frontend is increasingly broad, but it works best when it remains a clean client for backend truth rather than a competing source of game state.
