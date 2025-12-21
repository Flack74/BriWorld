# Redis Usage in BriWorld

## ✅ Current Status
- **Configured**: Yes (Upstash Redis)
- **Connected**: Yes (with TLS support)
- **Production Ready**: Yes

## 🎯 What Redis Controls

### 1. **Timer System** (FLAG mode only)
- **Location**: `internal/ws/rooms.go` lines 403, 431, 453, 584
- **Functions**: `SetTimerDeadline()`, `GetTimerDeadline()`
- **Purpose**: Stores round deadline as Unix timestamp to prevent timer drift
- **Benefit**: Synchronized timers across all clients, survives server restarts

### 2. **Player Color Management**
- **Location**: `internal/ws/rooms.go` lines 243, 784
- **Function**: `SetPlayerColor()`
- **Purpose**: Atomic color assignment with duplicate prevention
- **Benefit**: Prevents race conditions when multiple players select colors simultaneously

### 3. **Country Painting** (World Map mode)
- **Location**: `internal/ws/rooms.go` line 508
- **Function**: `PaintCountry()`
- **Purpose**: Prevents duplicate country painting
- **Benefit**: Ensures only one player can paint each country (atomic operation)

### 4. **Room Activity Tracking**
- **Function**: `UpdateRoomActivity()`
- **Purpose**: Refreshes 30-minute TTL on all room keys
- **Benefit**: Auto-cleanup of inactive rooms

## ❌ What Redis Does NOT Control

### Game Start Logic
- **NOT in Redis**: Game start is handled in-memory
- **Location**: `internal/ws/rooms.go` line 275-309
- **Process**:
  1. Owner clicks "Start Game"
  2. Validates owner, player count, room status
  3. Immediately calls `StartRound()`
  4. No Redis involved

### Why Game Start Might Be Slow

1. **Render Cold Starts** (most likely)
   - Free tier spins down after 15 min inactivity
   - Takes 30-60 seconds to wake up

2. **Network Latency**
   - Neon PostgreSQL connection (first query)
   - Upstash Redis connection (first operation)

3. **WebSocket Connection**
   - Initial handshake and authentication
   - Room state synchronization

## 🔧 Redis Configuration

### Production (.env)
```env
REDIS_ADDR=allowing-kid-35323.upstash.io:6379
REDIS_PASSWORD=AYn7AAIncDE3ZjhjZGIzMTNmY2Q0MzA4ODZjY2IxZDFmYTFjYmYyY3AxMzUzMjM
REDIS_DB=0
REDIS_TLS=true
```

### Connection Settings
- **Pool Size**: 10 connections
- **Dial Timeout**: 5 seconds
- **Read/Write Timeout**: 3 seconds
- **TLS**: Enabled (required for Upstash)

## 📊 Redis Keys Structure

```
room:{code}:colors    - Player colors (Hash) - TTL: 30min
room:{code}:players   - Player list (Set) - TTL: 30min
room:{code}:scores    - Player scores (Hash) - TTL: 30min
room:{code}:painted   - Painted countries (Hash) - TTL: 30min
room:{code}:state     - Game state JSON (String) - TTL: 30min
room:{code}:timer     - Round deadline (Hash) - TTL: 30min
room:{code}:meta      - Room metadata (Hash) - TTL: 30min
```

## 🚀 Performance Impact

### With Redis (Current)
- ✅ Synchronized timers (no drift)
- ✅ Atomic color selection (no duplicates)
- ✅ Atomic country painting (no conflicts)
- ✅ Auto-cleanup after 30 minutes

### Without Redis (Fallback)
- ⚠️ In-memory only (works but less reliable)
- ⚠️ Timer drift possible
- ⚠️ Race conditions on color selection
- ⚠️ Manual cleanup required

## 🎮 Game Start Flow

```
User clicks "Start Game"
  ↓
WebSocket message: { type: "start_game" }
  ↓
HandleMessage() → StartGame()
  ↓
Validate: owner, player count, status
  ↓
Set status = "in_progress"
  ↓
StartRound() [IMMEDIATE - NO REDIS]
  ↓
Select random country
  ↓
Broadcast "round_started"
  ↓
Start timer (Redis stores deadline)
```

**Total time: <100ms** (excluding network latency)

## 💡 Recommendations

### To Fix Slow Start on Render:
1. **Upgrade to paid tier** - Eliminates cold starts
2. **Keep-alive service** - Already implemented (pings every 10 min)
3. **Connection pooling** - Already configured

### Redis is Working Correctly
- No changes needed to Redis configuration
- Slow start is NOT caused by Redis
- Redis is only used for specific atomic operations

## 🔍 Debugging Slow Start

Check logs for:
```bash
# Redis connection
✅ Redis connected

# Game start
Starting game: room=ABC123, mode=FLAG, rounds=10

# Round start
FLAG mode: Round 1 - Country US (United States)
```

If you see delays between these logs, the issue is:
- Network latency (Neon/Upstash)
- Render cold start
- NOT Redis operations
