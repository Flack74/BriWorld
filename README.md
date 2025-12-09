# 🌍 BriWorld - Multiplayer Geography Quiz Game



Real-time multiplayer geography quiz game built with Go, WebSocket, Neon PostgreSQL, and modern web technologies.

## ✨ Features

- 🎮 Real-time multiplayer (up to 6 players per room)
- 🚩 Flag quiz mode with 170+ countries
- 🔐 JWT authentication
- 🎯 Fuzzy answer matching (accepts close answers)
- 📊 Live leaderboards
- 💬 In-game chat
- ⏱️ Countdown timer
- 🌓 Dark mode support
- 📱 Responsive design

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
- Go 1.25 with Fiber v2
- Neon PostgreSQL (pgx/v5)
- WebSocket for real-time communication
- JWT authentication
- bcrypt password hashing

**Frontend:**
- Vanilla JavaScript (ES6+)
- Modern CSS3 with custom design system
- WebSocket client for real-time updates
- Responsive design

**Database:**
- Neon PostgreSQL (serverless)
- Raw pgx queries (no ORM)
- Database migrations
- SSL/TLS encryption

## 📁 Project Structure

```
BriWorld/
├── cmd/server/              # Application entry point
├── internal/
│   ├── config/             # Configuration management
│   ├── database/           # DB connection & migrations
│   ├── documentation/      # Project documentation
│   ├── handlers/           # HTTP request handlers
│   ├── services/           # Business logic layer
│   ├── middleware/         # Authentication middleware
│   ├── models/             # Data models & structs
│   ├── utils/              # Helper utilities
│   ├── game/               # Game logic & mechanics
│   ├── http/               # Route definitions
│   └── ws/                 # WebSocket handlers
├── static/
│   ├── world.json          # Country data (170+ countries)
│   ├── world.svg           # World map SVG
│   ├── css/                # Stylesheets & design system
│   ├── js/                 # Frontend JavaScript
│   └── flags/              # Country flag assets
├── web/                    # HTML templates
├── docker-compose.yml      # Local development setup
├── Dockerfile              # Production container
├── render.yaml             # Render deployment config
└── Makefile                # Build automation
```

## 🎮 How to Play

1. Open http://localhost:8080
2. Click "Play Now"
3. Enter username
4. Create or join room
5. Game starts automatically
6. Guess country names from flags
7. Compete on live leaderboard

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

**Approach:** Raw pgx queries (not GORM)

**Why?**
- Direct control
- Fast development
- No magic
- Type-safe enough

**sqlc ready** (optional):
```bash
sqlc generate
```

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
- ✅ **Database**: 100% Complete (Neon PostgreSQL)
- ✅ **WebSocket**: 100% Complete (Real-time multiplayer)
- ✅ **Game Logic**: 95% Complete (Flag quiz working)
- ✅ **Frontend**: 90% Complete (Responsive design)
- ✅ **Deployment**: 100% Complete (Docker + Render)
- ❌ **Testing**: 0% Complete (No tests written yet)

**Overall: 85% Complete** 🎉

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request



## 🌟 Live Features

- 🎮 **Multiplayer Rooms**: Up to 6 players per game
- 🚩 **Flag Recognition**: 170+ countries with fuzzy matching
- ⚡ **Real-time**: Instant updates via WebSocket
- 🔐 **Secure**: JWT authentication + bcrypt hashing
- 📱 **Responsive**: Works on desktop, tablet, mobile
- 🌙 **Dark Mode**: Eye-friendly gaming experience
- 💬 **Chat**: In-game communication
- 📊 **Leaderboard**: Live scoring and rankings

## 🙏 Acknowledgments

- **Country Data**: Natural Earth world.json dataset
- **Flag Images**: [flagcdn.com](https://flagcdn.com) API
- **Infrastructure**: [Neon](https://neon.tech) PostgreSQL + [Render](https://render.com) hosting
- **Built with**: Go, Fiber, PostgreSQL, WebSocket, Vanilla JS

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**🌍 Made with ❤️ by Flack for geography enthusiasts worldwide**

[⭐ Star this repo](https://github.com/yourusername/BriWorld) | [🐛 Report Bug](https://github.com/yourusername/BriWorld/issues) | [💡 Request Feature](https://github.com/yourusername/BriWorld/issues)
