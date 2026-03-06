# 🌍 BriWorld Backend

> **Production-ready Go backend with WebSocket real-time multiplayer, JWT authentication, and PostgreSQL + Redis**

Built with **Go 1.25**, **Fiber v2**, **GORM**, **Neon PostgreSQL**, and **Upstash Redis**.

---

## 🏗️ Architecture

```
backend/
├── cmd/server/          # Application entry point
├── internal/
│   ├── bootstrap/       # App initialization
│   ├── config/          # Configuration management
│   ├── database/        # GORM + migrations
│   ├── domain/          # Domain models & enums
│   ├── game/            # Game logic & modes
│   ├── handlers/        # HTTP request handlers
│   ├── http/            # Route definitions
│   ├── keepalive/       # Render keep-alive service
│   ├── middleware/      # JWT auth middleware
│   ├── models/          # Database models
│   ├── redis/           # Redis client & operations
│   ├── services/        # Business logic layer
│   ├── utils/           # Helper utilities
│   └── ws/              # WebSocket handlers
├── static/              # Game data (countries, flags)
├── Music/               # Background music & SFX
├── Dockerfile           # Production container
├── docker-compose.yml   # Local development
└── go.mod               # Go dependencies
```

---

## ✨ Features

### Core
- **Real-time multiplayer** - WebSocket with broadcast messaging
- **JWT authentication** - HS256 with refresh tokens
- **Password security** - bcrypt (cost 12)
- **CORS protection** - Environment-based allowed origins
- **Rate limiting** - 10 requests/minute on auth endpoints
- **Graceful shutdown** - 10-second timeout

### Game Modes
- Flag Quiz, World Map, Capital Rush, Silhouette, Emoji, Border Logic, Team Battle, Last Standing

### Database
- **GORM ORM** - Auto-migrations, relationships
- **Connection pooling** - Optimized for production
- **SSL/TLS** - Required for production (Neon)

### Caching
- **Redis** - Session management, room state, painted countries
- **Atomic operations** - Prevent race conditions
- **TLS support** - Upstash Redis

---

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
go mod download

# Install Air for hot reload
go install github.com/air-verse/air@latest

# Copy environment file
cp .env.example .env

# Update .env with your credentials

# Run with hot reload
air

# Or run directly
go run cmd/server/main.go
```

### Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

---

## 📋 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=briworld
DB_PASSWORD=your_password
DB_NAME=briworld_db
DB_SSL_MODE=disable  # Use 'require' for production

# Server
PORT=8080
ENV=development  # or 'production'

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-long
JWT_EXPIRY=86400  # 24 hours
REFRESH_TOKEN_EXPIRY=2592000  # 30 days

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Redis
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false  # Use 'true' for Upstash

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

---

## 🎯 API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register       # Register new user
POST /api/auth/login          # User login
POST /api/auth/refresh        # Refresh JWT token
POST /api/auth/forgot-password # Password reset
```

### User Profile (Protected)
```
GET    /api/user/profile      # Get user profile
PUT    /api/user/profile      # Update profile
POST   /api/user/avatar       # Upload avatar
DELETE /api/user/avatar       # Delete avatar
```

### Game
```
GET /api/rooms                # List active rooms
```

### WebSocket
```
WS /ws                        # Real-time game connection
WS /ws/spectate/:roomCode     # Spectator mode
```

---

## 🔐 Security Best Practices

### Implemented
- ✅ JWT with HS256 algorithm
- ✅ bcrypt password hashing (cost 12)
- ✅ Password strength validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS with whitelist
- ✅ Rate limiting on auth endpoints
- ✅ Environment-based secrets
- ✅ Refresh token rotation
- ✅ Server-authoritative game logic

### Recommendations
- Use strong JWT_SECRET (min 32 characters)
- Enable SSL/TLS in production
- Rotate secrets regularly
- Monitor failed login attempts
- Implement IP-based rate limiting

---

## 🧪 Testing

```bash
# Run tests
go test ./...

# Test with coverage
go test -cover ./...

# Test specific package
go test ./internal/utils

# Benchmark
go test -bench=. ./internal/utils
```

### Manual Testing

```bash
# Health check
curl http://localhost:8080/api/health

# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@test.com","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Test123!@#"}'

# Get profile (replace TOKEN)
curl http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer TOKEN"
```

---

## 🎮 WebSocket Protocol

### Connection
```
ws://localhost:8080/ws?room=ABC123&username=john&session=xyz&mode=FLAG&type=SINGLE&rounds=10&timeout=15&token=JWT_TOKEN
```

### Message Types

**Client → Server:**
```json
{"type": "start_game"}
{"type": "submit_answer", "payload": {"answer": "India", "response_time_ms": 3500}}
{"type": "chat_message", "payload": {"message": "Hello!"}}
{"type": "color_selected", "payload": {"color": "#FF5733"}}
{"type": "set_map_mode", "payload": {"mode": "FREE"}}
{"type": "restart_game"}
{"type": "close_room"}
```

**Server → Client:**
```json
{"type": "room_joined", "payload": {...}}
{"type": "room_update", "payload": {...}}
{"type": "round_started", "payload": {...}}
{"type": "timer_update", "payload": {"time_remaining": 10}}
{"type": "answer_submitted", "payload": {...}}
{"type": "score_update", "payload": {"scores": {...}}}
{"type": "country_painted", "payload": {...}}
{"type": "round_ended", "payload": {...}}
{"type": "game_completed", "payload": {...}}
{"type": "chat_message", "payload": {...}}
{"type": "message_reaction", "payload": {"message_id": "123", "reactions": {"👍": ["user1", "user2"]}}}
```

---

## 🔧 Go Best Practices

### Code Organization
- ✅ Clean architecture (handlers → services → repositories)
- ✅ Dependency injection
- ✅ Interface-based design
- ✅ Separation of concerns

### Concurrency
- ✅ Mutex for shared state
- ✅ Context for cancellation
- ✅ Goroutine leak prevention
- ✅ Channel-based communication

### Error Handling
- ✅ Explicit error returns
- ✅ Error wrapping with context
- ✅ Graceful degradation
- ✅ Structured logging

### Performance
- ✅ Connection pooling (database, Redis)
- ✅ Efficient JSON marshaling
- ✅ Minimal allocations
- ✅ Buffered channels

---

## 📊 Database Schema

### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  total_points INT DEFAULT 0,
  total_games INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  win_streak INT DEFAULT 0,
  longest_win_streak INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sessions
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚢 Production Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Render

1. Push code to GitHub
2. Create Render Web Service
3. Set environment variables
4. Deploy!

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U briworld -d briworld_db

# Check logs
docker-compose logs db
```

### Redis Connection Failed
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# Check logs
docker-compose logs redis
```

### WebSocket Connection Refused
```bash
# Check server is running
curl http://localhost:8080/api/health

# Check CORS settings
# Ensure ALLOWED_ORIGINS includes your frontend URL
```

---

## 📈 Performance Tuning

### Database
```go
// Adjust connection pool
db.DB.SetMaxOpenConns(25)
db.DB.SetMaxIdleConns(5)
db.DB.SetConnMaxLifetime(5 * time.Minute)
```

### Redis
```go
// Use pipelining for bulk operations
pipe := redis.Client.Pipeline()
pipe.Set(ctx, "key1", "value1", 0)
pipe.Set(ctx, "key2", "value2", 0)
pipe.Exec(ctx)
```

### WebSocket
```go
// Increase buffer sizes for high traffic
Broadcast: make(chan []byte, 1024)
Send: make(chan []byte, 512)
```

---

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

---

**Built with ❤️ using Go 1.25**
