# 🌍 BriWorld - Multiplayer Geography Quiz Game

Real-time multiplayer geography quiz game built with Go, WebSocket, Neon PostgreSQL, and modern React frontend.

## ✨ Features

- 🎮 **Real-time multiplayer** (up to 6 players per room)
- 🚩 **Flag Quiz Mode** - Guess countries from flags (170+ countries)
- 🗺️ **Interactive World Map Mode** - Click and paint countries
  - **FREE Mode**: No timer, paint any country you can name
  - **TIMED Mode**: 15-second countdown to guess highlighted countries with smart auto-zoom
- 🎨 **Color Selection** - Choose from 6 unique colors to paint your countries
- 🔐 **JWT Authentication** with secure user management
- 🎯 **Fuzzy Answer Matching** (accepts close answers like "Indai" → "India")
- 📊 **Live Leaderboards** with real-time score updates and player colors
- 💬 **In-game Chat** for player communication (visible on all devices)
- ⏱️ **Fixed Countdown Timer** (top-right corner, only in timed modes)
- 🔄 **Play Again Feature** - Instant restart for single player, waiting room for multiplayer
- 🎯 **Smart Auto-Zoom** - Dynamic zoom based on country size in TIMED map mode
- 📊 **Simplified Game Stats** - Clean correct/incorrect tracking
- 🏷️ **Clean Room Codes** - 6-character codes without prefixes
- 🌓 **Dark Mode Support** with modern UI
- 📱 **Fully Responsive Design** (optimized for iPhone, tablet, desktop)

## 🚀 Quick Start

### 🌐 Live Demo
**[Play BriWorld Now!](https://your-render-url.onrender.com)** (Deployed on Render)

### Using Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/Flack74/BriWorld.git
cd BriWorld

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

Access: http://localhost:8080

### Local Development

```bash
# Install dependencies
go mod download

# Install Air for hot reload
go install github.com/air-verse/air@latest

# Copy environment file
cp .env.example .env

# Run with hot reload
make dev
```

## 📋 Prerequisites

- Go 1.25+
- Docker & Docker Compose
- Make (optional)
- Neon PostgreSQL account (for production)

## 🏗️ Architecture

**Backend:**
- Go 1.25 with Fiber v2 framework
- Neon PostgreSQL with GORM ORM
- WebSocket for real-time multiplayer communication
- JWT authentication with secure middleware
- bcrypt password hashing (cost 12)
- Fuzzy string matching for answer validation

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS + shadcn/ui components
- Custom WebSocket hooks for real-time updates
- D3.js for interactive world map rendering
- Responsive design with mobile-first approach

**Database:**
- Neon PostgreSQL (serverless)
- Raw pgx queries (no ORM)
- Database migrations
- SSL/TLS encryption

## 📁 Project Structure

```
BriWorld/
├── cmd/server/              # Go application entry point
├── internal/
│   ├── config/             # Configuration management
│   ├── database/           # GORM DB connection & migrations
│   ├── handlers/           # HTTP request handlers
│   ├── services/           # Business logic layer
│   ├── middleware/         # JWT authentication middleware
│   ├── models/             # GORM data models
│   ├── utils/              # Helper utilities (JWT, fuzzy matching)
│   ├── game/               # Game logic & country data
│   ├── http/               # API route definitions
│   └── ws/                 # WebSocket real-time handlers
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks (WebSocket)
│   │   ├── types/          # TypeScript type definitions
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── web-dist/               # Built frontend (served by Go)
├── static/
│   └── world.json          # Country data (170+ countries)
├── docker-compose.yml      # Local development setup
├── Dockerfile              # Production container
├── build-frontend.sh       # Frontend build script
└── Makefile                # Build automation
```

## 🎮 How to Play

### Flag Quiz Mode:
1. Open http://localhost:8080
2. Enter username and select "Flag Quiz"
3. Choose number of rounds (5, 10, 15, or 20)
4. Select room type (Single, Private, or Public)
5. Guess country names from flag images
6. Compete on live leaderboard with time-based scoring

### World Map Mode:
1. Select "World Map" in game lobby
2. Choose your unique paint color (6 options available)
3. Select mode:
   - **FREE Mode**: No timer, guess any country you can name
   - **TIMED Mode**: Choose rounds, then guess highlighted countries in 15 seconds with auto-zoom
4. Type country names to paint them on the map
5. Watch the map auto-zoom to highlighted countries (TIMED mode)
6. Compete to paint the most countries!
7. Click "Play Again" to restart or return to lobby

## 🔧 Configuration

### Local Development
Copy `.env.example` to `.env`:

```env
# Database (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=briworld
DB_PASSWORD=your_password
DB_NAME=briworld_db
DB_SSL_MODE=disable

# Server
PORT=8080
ENV=development

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-long
JWT_EXPIRY=86400

# Game Settings
MAX_PLAYERS_PER_ROOM=6
ROUND_DURATION_SECONDS=15
```

### Production (Neon)
```env
# Neon PostgreSQL
DB_HOST=your-neon-hostname.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=your-neon-password
DB_NAME=neondb
DB_SSL_MODE=require

# Server
PORT=8080
ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

## 📊 Database

**Approach:** GORM ORM with PostgreSQL

**Models:**
- Users (authentication, stats, preferences)
- Rooms (multiplayer game sessions)
- Game Sessions (match history and scores)

**Features:**
- Auto-migrations on startup
- Relationship management
- Connection pooling
- SSL/TLS encryption for production

## 🧪 Testing

```bash
# Run tests
make test

# Test auth
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@test.com","password":"Test123!"}'
```

## 🚢 Production Deployment

### Deploy to Render (Recommended)

1. **Fork this repository**
2. **Connect to Render**:
   - Create new Web Service
   - Connect your GitHub repo
   - Choose "Docker" as build method
3. **Set environment variables** (see Configuration section)
4. **Deploy!** 🚀

### Manual Docker Deployment

```bash
# Build production image
docker build --target production -t briworld:prod .

# Run with environment variables
docker run -p 8080:8080 \
  -e DB_HOST=your-neon-host \
  -e DB_USER=neondb_owner \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=neondb \
  -e DB_SSL_MODE=require \
  -e JWT_SECRET=your-secret \
  briworld:prod
```

### Using render.yaml

The project includes `render.yaml` for one-click deployment:

```bash
# Just push to GitHub - Render auto-deploys!
git push origin main
```

## 🎯 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # User login
POST   /api/auth/logout      # User logout
POST   /api/auth/refresh     # Refresh JWT token
```

### Game
```
GET    /api/rooms            # List active rooms (protected)
POST   /api/rooms            # Create new room (protected)
GET    /api/health           # Health check
```

### WebSocket
```
WS     /ws                   # Real-time game connection
```

### Static Assets
```
GET    /static/*             # CSS, JS, images
GET    /                     # Game interface
```

## 🔐 Security

- JWT authentication (HS256)
- bcrypt password hashing (cost 12)
- Password strength validation
- CORS configuration
- SQL injection prevention
- Environment-based secrets

## 🌟 Key Features

### Fuzzy Matching
Accepts close answers using Levenshtein distance:
- "Indai" → "India" ✅
- "Brazl" → "Brazil" ✅
- Max 2 character difference

### Real-time Updates
- Player join/leave
- Score updates
- Chat messages
- Timer synchronization

### Country Data
- 170+ countries from world.json
- Random selection
- Flag images from flagcdn.com

## 🛠️ Development

```bash
# Hot reload
make dev

# Build
make build

# Run tests
make test

# Docker
make docker-up
make docker-down
```

## 📈 Project Status

- ✅ **Infrastructure**: 100% Complete
- ✅ **Authentication**: 100% Complete (JWT + bcrypt)
- ✅ **Database**: 100% Complete (GORM + PostgreSQL)
- ✅ **WebSocket**: 100% Complete (Real-time multiplayer)
- ✅ **Game Logic**: 100% Complete (Flag + Map modes)
- ✅ **Frontend**: 100% Complete (React + TypeScript)
- ✅ **UI/UX**: 100% Complete (Modern design system)
- ✅ **Map Integration**: 100% Complete (Interactive D3.js map with auto-zoom)
- ✅ **Color System**: 100% Complete (6 unique player colors)
- ✅ **Game Modes**: 100% Complete (FREE + TIMED map modes)
- ✅ **Mobile Optimization**: 100% Complete (iPhone, tablet responsive design)
- ✅ **Play Again Feature**: 100% Complete (Smart restart handling)
- ✅ **Room Code System**: 100% Complete (Clean 6-character codes)
- ✅ **Game Statistics**: 100% Complete (Simplified correct/incorrect tracking)
- ✅ **Timer UI**: 100% Complete (Fixed top-right positioning)
- ✅ **Deployment**: 100% Complete (Docker + Render)
- ❌ **Testing**: 0% Complete (No tests written yet)

**Overall: 98% Complete** 🎉

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request



## 🌟 Live Features

- 🎮 **Multiplayer Rooms**: Up to 6 players per game with real-time sync
- 🚩 **Flag Recognition**: 170+ countries with intelligent fuzzy matching
- 🗺️ **Interactive World Map**: Click-to-paint countries with D3.js rendering
- 🎨 **Color Customization**: 6 unique colors (Ocean Blue, Coral Rose, Desert Sand, etc.)
- ⚡ **Dual Game Modes**: FREE (unlimited time) + TIMED (15-second rounds with auto-zoom)
- 🔐 **Secure Authentication**: JWT tokens + bcrypt password hashing
- 📱 **Cross-Platform**: Fully responsive design optimized for mobile, tablet, and desktop
- 🌙 **Modern UI**: Dark mode with glassmorphism design
- 💬 **Real-time Chat**: In-game communication system (visible on all devices)
- 📊 **Live Leaderboard**: Dynamic scoring with player colors (full-width on mobile)
- ⏱️ **Fixed Timer Display**: Countdown positioned in top-right corner (timed modes only)
- 🎯 **Intelligent Matching**: Accepts "Indai" for "India", "Brazl" for "Brazil"
- 🔄 **Instant Replay**: Play again feature with smart room handling
- 🔍 **Smart Auto-Zoom**: Dynamic zoom levels (2x-15x) based on country size in TIMED mode
- 🏷️ **Clean Room Codes**: Simple 6-character codes (e.g., FKYYN8)
- 📊 **Simplified Stats**: Clean correct/incorrect tracking in game over screen

## 🙏 Acknowledgments

- **Country Data**: Natural Earth world.json dataset (170+ countries)
- **Flag Images**: [flagcdn.com](https://flagcdn.com) API for high-quality flag assets
- **Map Data**: TopoJSON world atlas for interactive map rendering
- **Infrastructure**: [Neon](https://neon.tech) PostgreSQL + [Render](https://render.com) hosting
- **UI Components**: [shadcn/ui](https://ui.shadcn.com) for modern React components
- **Built with**: Go, Fiber, GORM, PostgreSQL, WebSocket, React, TypeScript, D3.js, Tailwind CSS

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**🌍 Made with ❤️ by Flack for geography enthusiasts worldwide**

[⭐ Star this repo](https://github.com/yourusername/BriWorld) | [🐛 Report Bug](https://github.com/yourusername/BriWorld/issues) | [💡 Request Feature](https://github.com/yourusername/BriWorld/issues)
