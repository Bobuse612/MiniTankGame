# Client-Side Documentation

## Overview

The client consists of:
- **index.html** - Lobby page (room list, create game)
- **game.html** - Game page (canvas, UI)
- **game.js** - Game logic, rendering, input handling
- **config.js** - Shared configuration
- **maps.js** - Map definitions

## Client Responsibilities

### 1. User Input
- Capture keyboard events (WASD/ZQSD for movement, arrows for shooting)
- Track which keys are pressed
- Convert input to game actions

### 2. Client-Side Prediction
- Apply movement locally for instant feedback
- Don't wait for server confirmation
- Server will correct if prediction was wrong

### 3. Rendering (60 FPS)
- Draw game state to HTML5 Canvas
- Update every frame via `requestAnimationFrame`

### 4. Network Communication
- Send player actions to server
- Receive and apply updates from server

## Game Loop

```javascript
function gameLoop() {
    updatePlayer();    // 1. Apply input, move locally
    updateBullets();   // 2. Move bullets locally
    tryShoot();        // 3. Check if shooting
    render();          // 4. Draw everything
    requestAnimationFrame(gameLoop);  // 5. Repeat
}
```

### Step 1: Update Player (Client-Side Prediction)
```javascript
function updatePlayer() {
    // Apply acceleration from input
    if (moveKeys.up) velocityY -= ACCELERATION;
    if (moveKeys.down) velocityY += ACCELERATION;
    // ...

    // Apply friction
    velocityX *= FRICTION;
    velocityY *= FRICTION;

    // Calculate new position
    let newX = player.x + velocityX;
    let newY = player.y + velocityY;

    // Check collisions LOCALLY (prediction)
    if (!collidesWithObstacles(newX, newY, ...)) {
        player.x = newX;
        player.y = newY;
    }

    // Send to server (server will validate)
    socket.emit('move', { x: player.x, y: player.y, angle: player.angle });
}
```

### Step 2: Update Bullets
```javascript
function updateBullets() {
    for (const bullet of bullets) {
        // Move bullet in its direction
        bullet.x += Math.cos(bullet.angle) * BULLET_SPEED;
        bullet.y += Math.sin(bullet.angle) * BULLET_SPEED;
    }
}
```

### Step 3: Render
```javascript
function render() {
    // Clear canvas
    ctx.fillRect(0, 0, width, height);

    // Draw layers in order:
    drawGrid();        // Background grid
    drawObstacles();   // Walls and water
    drawBullets();     // All bullets
    drawTanks();       // All players
}
```

## Socket Events (Client-Side)

### Sending Events (Client → Server)
```javascript
// Join a room
socket.emit('joinRoom', roomId, (response) => {
    if (response.success) {
        // Store game state
        players = response.players;
        currentMap = response.map;
    }
});

// Move player
socket.emit('move', { x: player.x, y: player.y, angle: player.angle });

// Shoot
socket.emit('shoot', { x: bulletX, y: bulletY, angle: angle });
```

### Receiving Events (Server → Client)
```javascript
// Another player moved
socket.on('playerMoved', (data) => {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
    players[data.id].angle = data.angle;
});

// Bullet created
socket.on('bulletFired', (bullet) => {
    bullets[bullet.id] = bullet;
});

// Bullet destroyed
socket.on('bulletRemoved', (bulletId) => {
    delete bullets[bulletId];
});

// Player hit
socket.on('playerHit', (data) => {
    players[data.playerId].health = data.health;
});
```

## Input Handling

### Keyboard State Tracking
```javascript
const moveKeys = { up: false, down: false, left: false, right: false };
const shootKeys = { up: false, down: false, left: false, right: false };

document.addEventListener('keydown', (e) => {
    handleKeyChange(e.key, true);   // Key pressed
});

document.addEventListener('keyup', (e) => {
    handleKeyChange(e.key, false);  // Key released
});
```

### AZERTY vs QWERTY
```javascript
if (keyboardLayout === 'azerty') {
    // ZQSD layout
    case 'z': moveKeys.up = isPressed; break;
    case 'q': moveKeys.left = isPressed; break;
} else {
    // WASD layout
    case 'w': moveKeys.up = isPressed; break;
    case 'a': moveKeys.left = isPressed; break;
}
```

### 8-Direction Shooting
```javascript
function getShootAngle() {
    let dx = 0, dy = 0;

    if (shootKeys.up) dy -= 1;
    if (shootKeys.down) dy += 1;
    if (shootKeys.left) dx -= 1;
    if (shootKeys.right) dx += 1;

    if (dx === 0 && dy === 0) return null;

    // atan2 gives angle in radians
    return Math.atan2(dy, dx);
}
```

## Rendering Details

### Canvas Coordinate System
```
(0,0) ─────────────────────> X (800)
  │
  │
  │
  │
  ▼
  Y (600)
```

### Drawing a Tank
```javascript
function drawTank(player) {
    ctx.save();                           // Save current state
    ctx.translate(player.x, player.y);    // Move origin to tank center
    ctx.rotate(player.angle);             // Rotate canvas

    // Draw tank body (centered at origin)
    ctx.fillRect(-15, -15, 30, 30);

    // Draw barrel (pointing right = angle 0)
    ctx.fillRect(0, -4, 20, 8);

    ctx.restore();                        // Restore original state
}
```

### Drawing Obstacles
```javascript
function drawObstacles() {
    for (const obstacle of currentMap.obstacles) {
        if (obstacle.type === 'wall') {
            // Gray brick pattern
            ctx.fillStyle = '#4a4a5a';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else if (obstacle.type === 'water') {
            // Blue with animated waves
            ctx.fillStyle = '#1a5f7a';
            ctx.fillRect(...);
            // Draw wave lines using sin()
        }
    }
}
```

## Client-Server Synchronization

### Why Client-Side Prediction?
Without prediction, there would be noticeable delay:
```
1. Player presses key
2. Send to server (50ms network latency)
3. Server processes
4. Server sends back (50ms)
5. Client updates position
Total: ~100ms delay = laggy feeling
```

With prediction:
```
1. Player presses key
2. Client moves IMMEDIATELY (prediction)
3. Also send to server
4. Server validates and broadcasts
5. Client already in correct position (usually)
```

### Handling Desync
If server says position is different from client prediction:
```javascript
socket.on('playerMoved', (data) => {
    if (data.id === myId) {
        // Server corrected our position
        // Snap to server position (or interpolate for smoothness)
        player.x = data.x;
        player.y = data.y;
    }
});
```
