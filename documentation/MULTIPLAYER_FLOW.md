# Multiplayer Flow Documentation

## Connection Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    PLAYER JOINS THE GAME                          │
└──────────────────────────────────────────────────────────────────┘

  BROWSER                          SERVER
     │                                │
     │  1. Connect to server          │
     │  ────────────────────────────> │
     │                                │
     │  2. Auto-join 'lobby' room     │
     │  <──────────────────────────── │
     │                                │
     │  3. Request room list          │
     │     emit('getLobby')           │
     │  ────────────────────────────> │
     │                                │
     │  4. Receive room list          │
     │     on('lobbyUpdate')          │
     │  <──────────────────────────── │
     │                                │
     │  5. Create or Join room        │
     │     emit('createGame') or      │
     │     emit('joinRoom')           │
     │  ────────────────────────────> │
     │                                │
     │  6. Receive game state         │
     │     (players, map, etc.)       │
     │  <──────────────────────────── │
     │                                │
     │  7. Start game loop            │
     │                                │
```

## Room System (Socket.io Rooms)

Socket.io has built-in room support:

```javascript
// Server-side
socket.join('lobby');        // Add socket to 'lobby' room
socket.leave('lobby');       // Remove from 'lobby'
socket.join('ROOM123');      // Add to game room

// Broadcast to room
io.to('lobby').emit('lobbyUpdate', data);     // Everyone in lobby
io.to('ROOM123').emit('playerJoined', player); // Everyone in that game
socket.to('ROOM123').emit(...);                // Everyone EXCEPT sender
```

## Game State Synchronization

### What the Server Tracks (Authoritative)
```javascript
room = {
    players: {
        'socket1': { x: 100, y: 200, health: 100, ... },
        'socket2': { x: 300, y: 400, health: 75, ... }
    },
    bullets: [
        { id: 'b1', x: 150, y: 220, angle: 0.5, ownerId: 'socket1' },
        { id: 'b2', x: 320, y: 380, angle: -1.2, ownerId: 'socket2' }
    ]
}
```

### What the Client Tracks (Local Copy)
```javascript
// Same structure, but:
// - Own player updated by local input (prediction)
// - Other players updated by server events
// - Bullets updated locally for smooth rendering
```

## Event Timeline: Complete Gameplay Scenario

```
TIME    CLIENT A              SERVER                CLIENT B
─────────────────────────────────────────────────────────────────

0ms     Connect               Accept connection
        ─────────────────────>

50ms    emit('joinRoom')      Create player A
        ─────────────────────>
                              Add to room
                              ─────────────────────> playerJoined(A)

100ms   [Receive state]
        Start game loop

200ms   Press 'W' key
        Move locally (predict)
        emit('move', pos)
        ─────────────────────>
                              Validate position
                              ─────────────────────> playerMoved(A)

250ms                                               [Update A's position]

300ms   Press 'ArrowRight'
        emit('shoot', data)
        ─────────────────────>
                              Create bullet
                              Broadcast
        <─────────────────────────────────────────> bulletFired

350ms   [Add bullet locally]                        [Add bullet locally]

400ms                         Game loop:
                              - Move bullet
                              - Check collision
                              - Bullet hits B!

        <─────────────────────────────────────────> bulletRemoved
        <─────────────────────────────────────────> playerHit(B)

450ms   [Remove bullet]                             [Remove bullet]
        [Update B health]                           [Update own health]

500ms                         B health <= 0
                              - Increment A score
                              - Respawn B

        <─────────────────────────────────────────> scoreUpdate(A)
        <─────────────────────────────────────────> playerRespawned(B)
```

## Handling Network Issues

### Player Disconnects
```javascript
socket.on('disconnect', () => {
    // 1. Remove from room
    delete room.players[socket.id];

    // 2. Notify others
    io.to(roomId).emit('playerLeft', socket.id);

    // 3. Check if room empty
    if (Object.keys(room.players).length === 0) {
        delete rooms[roomId];  // Clean up
    }
});
```

### Reconnection
Currently, if a player disconnects and reconnects:
- They get a new socket ID
- They must rejoin from lobby
- Previous game state is lost

(Could be improved with session persistence)

## Bandwidth Optimization

### Current Implementation (Simple)
- Every movement sends full position: `{x, y, angle}`
- ~20-60 updates per second per player
- Good for small number of players

### Potential Optimizations
1. **Delta compression**: Only send what changed
2. **Interpolation**: Send fewer updates, interpolate between them
3. **Dead reckoning**: Server predicts movement, only correct when wrong
4. **Area of interest**: Only send updates about nearby players

## Security Considerations

### Server Validation
```javascript
// Server validates all movement
socket.on('move', (data) => {
    // Clamp to bounds
    newX = Math.max(15, Math.min(785, data.x));

    // Check collision with obstacles
    if (!collidesWithObstacles(newX, newY, ...)) {
        player.x = newX;
        player.y = newY;
    }
    // If collision, player position unchanged
});
```

### What Server Prevents
- Moving through walls
- Teleporting (large position jumps)
- Shooting without cooldown (server tracks timing)
- Damaging yourself
- Invalid room access

### What Could Be Added
- Rate limiting (max events per second)
- Input validation (reasonable angles, positions)
- Anti-speed-hack (max distance per tick)
