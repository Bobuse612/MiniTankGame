# Tank Battle 2D - Technical Documentation

## Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview and key concepts |
| [SERVER.md](./SERVER.md) | Server-side implementation details |
| [CLIENT.md](./CLIENT.md) | Client-side implementation details |
| [MULTIPLAYER_FLOW.md](./MULTIPLAYER_FLOW.md) | Network communication and game flow |
| [PRODUCTION.md](./PRODUCTION.md) | Production deployment guide |

## Quick Summary

### How Multiplayer Works

```
┌─────────┐         WebSocket          ┌─────────┐
│ Client  │ ◄──────────────────────► │ Server  │
│ (Browser)│      (Socket.io)          │ (Node.js)│
└─────────┘                            └─────────┘
     │                                      │
     │  Handles:                            │  Handles:
     │  - User input                        │  - Game state (truth)
     │  - Rendering                         │  - Room management
     │  - Local prediction                  │  - Collision detection
     │                                      │  - Broadcasting updates
```

### Key Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| Server | Node.js | JavaScript runtime |
| HTTP Server | Express.js | Serve static files |
| Real-time | Socket.io | WebSocket communication |
| Rendering | HTML5 Canvas | 2D graphics |
| Client Logic | Vanilla JS | No framework needed |

### Data Flow

1. **Player Input** → Client captures keyboard events
2. **Local Prediction** → Client updates position immediately
3. **Send to Server** → `socket.emit('move', {x, y, angle})`
4. **Server Validates** → Checks collisions, bounds
5. **Broadcast** → Server sends update to other players
6. **Render** → All clients draw updated state

### Room Lifecycle

```
Create Room → Players Join → Gameplay → Players Leave → Room Deleted
```

- Rooms are isolated game instances
- Each room has its own players, bullets, and map
- Empty rooms are automatically deleted

### File Structure

```
MiniTankGame/
├── server.js           # Main server (Express + Socket.io)
├── package.json        # Dependencies
├── public/
│   ├── index.html      # Lobby page
│   ├── game.html       # Game page
│   ├── game.js         # Client game logic
│   ├── config.js       # Shared configuration
│   └── maps.js         # Map definitions
└── documentation/
    ├── README.md       # This file
    ├── ARCHITECTURE.md # System overview
    ├── SERVER.md       # Server details
    ├── CLIENT.md       # Client details
    └── MULTIPLAYER_FLOW.md # Network flow
```

## Common Questions

### Why Socket.io instead of plain WebSockets?
- Automatic reconnection
- Room support built-in
- Fallback to polling if WebSocket fails
- Event-based API (easier than raw messages)

### Why server-authoritative?
- Prevents cheating (clients can't lie about position)
- Single source of truth
- All players see same game state

### Why client-side prediction?
- Instant feedback for player
- Hides network latency
- Smooth gameplay feel

### How does collision detection work?
- Circle (tank/bullet) vs Rectangle (obstacle)
- Find closest point on rectangle to circle center
- If distance < radius, collision detected
