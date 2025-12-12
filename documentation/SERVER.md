# Server-Side Documentation

## Overview

The server (`server.js`) is built with:
- **Express.js** - HTTP server for serving static files
- **Socket.io** - WebSocket library for real-time communication
- **Node.js** - JavaScript runtime

## Server Responsibilities

### 1. Room Management
```javascript
const rooms = {};  // Stores all active game rooms

// Room structure:
rooms[roomId] = {
    id: 'ABC123',
    name: 'My Game',
    mapId: 'warehouse',
    players: {},      // All players in this room
    bullets: []       // All active bullets
};
```

### 2. Player Management
```javascript
// Player structure:
players[socketId] = {
    id: 'socket_id',
    x: 100,           // Position X
    y: 200,           // Position Y
    angle: 0,         // Rotation (radians)
    color: '#4CAF50', // Tank color
    score: 0,
    health: 100
};
```

### 3. Game Loop (60 FPS)
```javascript
setInterval(() => {
    for (const roomId in rooms) {
        // 1. Move all bullets
        // 2. Check bullet-wall collisions
        // 3. Check bullet-player collisions
        // 4. Handle damage and respawns
        // 5. Remove expired bullets
    }
}, 1000 / 60);  // 60 times per second
```

## Socket Events (Server-Side)

### Incoming Events (Client → Server)

| Event | Data | Description |
|-------|------|-------------|
| `getLobby` | - | Request list of active rooms |
| `createGame` | `{name, map}` | Create a new game room |
| `joinRoom` | `roomId` | Join an existing room |
| `leaveRoom` | - | Leave current room |
| `move` | `{x, y, angle}` | Update player position |
| `shoot` | `{x, y, angle}` | Fire a bullet |

### Outgoing Events (Server → Client)

| Event | Data | Description |
|-------|------|-------------|
| `lobbyUpdate` | `{rooms}` | Updated list of rooms |
| `playerJoined` | `{player}` | New player joined room |
| `playerLeft` | `playerId` | Player left room |
| `playerMoved` | `{id, x, y, angle}` | Player position update |
| `bulletFired` | `{bullet}` | New bullet created |
| `bulletRemoved` | `bulletId` | Bullet destroyed |
| `playerHit` | `{playerId, health}` | Player took damage |
| `playerRespawned` | `{player}` | Player respawned |
| `scoreUpdate` | `{playerId, score}` | Score changed |

## Collision Detection

### Circle vs Rectangle (Tank/Bullet vs Obstacle)
```javascript
function checkObstacleCollision(x, y, radius, obstacle) {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
    const closestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));

    // Calculate distance
    const dx = x - closestX;
    const dy = y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < radius;
}
```

### Collision Types
- **Wall + Player** → Block movement
- **Wall + Bullet** → Destroy bullet
- **Water + Player** → Block movement
- **Water + Bullet** → Pass through (no collision)
- **Bullet + Player** → Deal damage, destroy bullet

## Room Lifecycle

```
1. CREATE ROOM
   └── Client sends 'createGame' with name and map
   └── Server generates roomId, stores room in 'rooms' object
   └── Server broadcasts 'lobbyUpdate' to all clients in lobby

2. JOIN ROOM
   └── Client sends 'joinRoom' with roomId
   └── Server adds player to room.players
   └── Server sends game state back to client
   └── Server broadcasts 'playerJoined' to other players in room

3. GAMEPLAY
   └── Clients send 'move' and 'shoot' events
   └── Server validates and broadcasts updates
   └── Server game loop handles physics

4. LEAVE ROOM
   └── Client sends 'leaveRoom' OR disconnects
   └── Server removes player from room
   └── Server broadcasts 'playerLeft'
   └── If room empty → delete room, broadcast 'lobbyUpdate'
```

## Data Flow Example: Shooting

```
CLIENT A                    SERVER                      CLIENT B
    │                          │                            │
    │ shoot {x,y,angle}        │                            │
    │─────────────────────────>│                            │
    │                          │                            │
    │                          │ Create bullet object       │
    │                          │ Add to room.bullets        │
    │                          │                            │
    │      bulletFired         │      bulletFired           │
    │<─────────────────────────│───────────────────────────>│
    │                          │                            │
    │                          │ Game loop moves bullet     │
    │                          │ Detects collision          │
    │                          │                            │
    │      bulletRemoved       │      bulletRemoved         │
    │<─────────────────────────│───────────────────────────>│
    │      playerHit           │      playerHit             │
    │<─────────────────────────│───────────────────────────>│
```
