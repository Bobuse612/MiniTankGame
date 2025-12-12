// Game constants (from CONFIG)
const TANK_SIZE = CONFIG.TANK_SIZE;
const BARREL_LENGTH = CONFIG.BARREL_LENGTH;
const BULLET_SIZE = CONFIG.BULLET_SIZE;
const BULLET_SPEED = CONFIG.BULLET_SPEED;

// Movement physics (from CONFIG)
const ACCELERATION = CONFIG.ACCELERATION;
const FRICTION = CONFIG.FRICTION;
const MAX_SPEED = CONFIG.MAX_SPEED;

// Keyboard layout setting
let keyboardLayout = CONFIG.DEFAULT_KEYBOARD;

// Game state
let canvas, ctx;
let socket;
let myId = null;
let players = {};
let bullets = {};
let gameWidth = 800;
let gameHeight = 600;
let currentMap = null;
let roomId = null;

// Player velocity
let velocityX = 0;
let velocityY = 0;

// Input state - movement keys (ZQSD for AZERTY, WASD for QWERTY)
const moveKeys = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Arrow keys for shooting direction
const shootKeys = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Toggle keyboard layout
function toggleKeyboard() {
    keyboardLayout = keyboardLayout === 'azerty' ? 'qwerty' : 'azerty';
    updateKeyboardDisplay();
    moveKeys.up = moveKeys.down = moveKeys.left = moveKeys.right = false;
}

// Update keyboard display in UI
function updateKeyboardDisplay() {
    const display = document.getElementById('keyboard-display');
    const moveKeysDisplay = document.getElementById('move-keys');
    if (display) {
        display.textContent = keyboardLayout.toUpperCase();
    }
    if (moveKeysDisplay) {
        moveKeysDisplay.textContent = keyboardLayout === 'azerty' ? 'ZQSD' : 'WASD';
    }
}

// Leave game and go back to lobby
function leaveGame() {
    if (socket) {
        socket.emit('leaveRoom');
    }
    window.location.href = '/';
}

// Get room ID from URL
function getRoomIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
}

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    roomId = getRoomIdFromUrl();
    if (!roomId) {
        alert('No room specified!');
        window.location.href = '/';
        return;
    }

    // Connect to server
    socket = io();

    setupSocketEvents();
    setupInputEvents();
    updateKeyboardDisplay();
}

// Setup socket event handlers
function setupSocketEvents() {
    socket.on('connect', () => {
        updateConnectionStatus(true);
        // Join the room
        socket.emit('joinRoom', roomId, (response) => {
            if (response.success) {
                myId = response.playerId;
                players = response.players;
                currentMap = response.map;
                gameWidth = response.gameWidth;
                gameHeight = response.gameHeight;

                // Resize canvas to match map dimensions
                canvas.width = gameWidth;
                canvas.height = gameHeight;

                // Update room name display
                document.getElementById('room-name').textContent = response.roomName;

                updateUI();
                updateScoreboard();

                // Start game loop
                requestAnimationFrame(gameLoop);
            } else {
                alert(response.error || 'Failed to join room');
                window.location.href = '/';
            }
        });
    });

    socket.on('disconnect', () => {
        updateConnectionStatus(false);
    });

    socket.on('playerJoined', (player) => {
        players[player.id] = player;
        updateScoreboard();
    });

    socket.on('playerLeft', (playerId) => {
        delete players[playerId];
        updateScoreboard();
    });

    socket.on('playerMoved', (data) => {
        if (players[data.id]) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            players[data.id].angle = data.angle;
        }
    });

    socket.on('bulletFired', (bullet) => {
        bullets[bullet.id] = bullet;
    });

    socket.on('bulletRemoved', (bulletId) => {
        delete bullets[bulletId];
    });

    socket.on('playerHit', (data) => {
        if (players[data.playerId]) {
            players[data.playerId].health = data.health;
            if (data.playerId === myId) {
                updateUI();
            }
        }
    });

    socket.on('playerRespawned', (player) => {
        players[player.id] = player;
        if (player.id === myId) {
            // Reset velocity on respawn
            velocityX = 0;
            velocityY = 0;
            updateUI();
        }
    });

    socket.on('scoreUpdate', (data) => {
        if (players[data.playerId]) {
            players[data.playerId].score = data.score;
            if (data.playerId === myId) {
                updateUI();
            }
            updateScoreboard();
        }
    });
}

// Setup input event handlers
function setupInputEvents() {
    document.addEventListener('keydown', (e) => {
        handleKeyChange(e.key, true);
        if (e.key.startsWith('Arrow')) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        handleKeyChange(e.key, false);
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function handleKeyChange(key, isPressed) {
    const lowerKey = key.toLowerCase();

    // Movement keys
    if (keyboardLayout === 'azerty') {
        switch (lowerKey) {
            case 'z': moveKeys.up = isPressed; break;
            case 's': moveKeys.down = isPressed; break;
            case 'q': moveKeys.left = isPressed; break;
            case 'd': moveKeys.right = isPressed; break;
        }
    } else {
        switch (lowerKey) {
            case 'w': moveKeys.up = isPressed; break;
            case 's': moveKeys.down = isPressed; break;
            case 'a': moveKeys.left = isPressed; break;
            case 'd': moveKeys.right = isPressed; break;
        }
    }

    // Arrow keys for shooting
    switch (key) {
        case 'ArrowUp': shootKeys.up = isPressed; break;
        case 'ArrowDown': shootKeys.down = isPressed; break;
        case 'ArrowLeft': shootKeys.left = isPressed; break;
        case 'ArrowRight': shootKeys.right = isPressed; break;
    }
}

// Get shooting angle from arrow keys (8 directions)
function getShootAngle() {
    let dx = 0;
    let dy = 0;

    if (shootKeys.up) dy -= 1;
    if (shootKeys.down) dy += 1;
    if (shootKeys.left) dx -= 1;
    if (shootKeys.right) dx += 1;

    if (dx === 0 && dy === 0) return null;
    return Math.atan2(dy, dx);
}

// Try to shoot
function tryShoot() {
    const angle = getShootAngle();
    if (angle !== null) {
        shoot(angle);
    }
}

// Shooting
let lastShot = 0;
const SHOOT_COOLDOWN = CONFIG.SHOOT_COOLDOWN;

function shoot(angle) {
    const now = Date.now();
    if (now - lastShot < SHOOT_COOLDOWN) return;
    if (!myId || !players[myId]) return;

    lastShot = now;
    const player = players[myId];
    player.angle = angle;

    socket.emit('shoot', {
        x: player.x + Math.cos(angle) * BARREL_LENGTH,
        y: player.y + Math.sin(angle) * BARREL_LENGTH,
        angle: angle
    });
}

// Check collision with obstacle (client-side prediction)
function checkObstacleCollision(x, y, radius, obstacle) {
    const closestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
    const closestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));
    const dx = x - closestX;
    const dy = y - closestY;
    return Math.sqrt(dx * dx + dy * dy) < radius;
}

function collidesWithObstacles(x, y, radius, types) {
    if (!currentMap || !currentMap.obstacles) return false;
    for (const obstacle of currentMap.obstacles) {
        if (types.includes(obstacle.type)) {
            if (checkObstacleCollision(x, y, radius, obstacle)) {
                return true;
            }
        }
    }
    return false;
}

// Update player position with momentum
function updatePlayer() {
    if (!myId || !players[myId]) return;

    const player = players[myId];

    // Apply acceleration based on input
    if (moveKeys.up) velocityY -= ACCELERATION;
    if (moveKeys.down) velocityY += ACCELERATION;
    if (moveKeys.left) velocityX -= ACCELERATION;
    if (moveKeys.right) velocityX += ACCELERATION;

    // Apply friction
    velocityX *= FRICTION;
    velocityY *= FRICTION;

    // Clamp velocity to max speed
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (speed > MAX_SPEED) {
        velocityX = (velocityX / speed) * MAX_SPEED;
        velocityY = (velocityY / speed) * MAX_SPEED;
    }

    // Stop if velocity is very small
    if (Math.abs(velocityX) < 0.01) velocityX = 0;
    if (Math.abs(velocityY) < 0.01) velocityY = 0;

    // Calculate new position
    let newX = player.x + velocityX;
    let newY = player.y + velocityY;

    // Clamp to bounds
    newX = Math.max(TANK_SIZE/2, Math.min(gameWidth - TANK_SIZE/2, newX));
    newY = Math.max(TANK_SIZE/2, Math.min(gameHeight - TANK_SIZE/2, newY));

    // Check collision with walls and water (client-side prediction)
    if (!collidesWithObstacles(newX, newY, TANK_SIZE/2, ['wall', 'water'])) {
        player.x = newX;
        player.y = newY;
    } else {
        // Try sliding along walls
        if (!collidesWithObstacles(newX, player.y, TANK_SIZE/2, ['wall', 'water'])) {
            player.x = newX;
            velocityY *= -CONFIG.WALL_BOUNCE;
        } else if (!collidesWithObstacles(player.x, newY, TANK_SIZE/2, ['wall', 'water'])) {
            player.y = newY;
            velocityX *= -CONFIG.WALL_BOUNCE;
        } else {
            velocityX *= -CONFIG.WALL_BOUNCE;
            velocityY *= -CONFIG.WALL_BOUNCE;
        }
    }

    // Wall bounce at edges
    if (player.x <= TANK_SIZE/2 || player.x >= gameWidth - TANK_SIZE/2) {
        velocityX *= -CONFIG.WALL_BOUNCE;
    }
    if (player.y <= TANK_SIZE/2 || player.y >= gameHeight - TANK_SIZE/2) {
        velocityY *= -CONFIG.WALL_BOUNCE;
    }

    // Send update to server
    socket.emit('move', {
        x: player.x,
        y: player.y,
        angle: player.angle
    });
}

// Check if line intersects rectangle (for bullet path)
function lineIntersectsRect(x1, y1, x2, y2, rect) {
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    // Check if either endpoint is inside
    if ((x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) ||
        (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom)) {
        return true;
    }

    // Check line-line intersections with rectangle edges
    const intersects = (ax, ay, bx, by, cx, cy, dx, dy) => {
        const denom = (dy - cy) * (bx - ax) - (dx - cx) * (by - ay);
        if (Math.abs(denom) < 0.0001) return false;
        const ua = ((dx - cx) * (ay - cy) - (dy - cy) * (ax - cx)) / denom;
        const ub = ((bx - ax) * (ay - cy) - (by - ay) * (ax - cx)) / denom;
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    };

    if (intersects(x1, y1, x2, y2, left, top, right, top)) return true;
    if (intersects(x1, y1, x2, y2, left, bottom, right, bottom)) return true;
    if (intersects(x1, y1, x2, y2, left, top, left, bottom)) return true;
    if (intersects(x1, y1, x2, y2, right, top, right, bottom)) return true;

    return false;
}

// Check if bullet path hits a wall
function bulletHitsWall(oldX, oldY, newX, newY) {
    if (!currentMap || !currentMap.obstacles) return false;
    for (const obstacle of currentMap.obstacles) {
        if (obstacle.type === 'wall') {
            if (lineIntersectsRect(oldX, oldY, newX, newY, obstacle)) {
                return true;
            }
        }
    }
    return false;
}

// Update local bullets
function updateBullets() {
    for (const id in bullets) {
        const bullet = bullets[id];
        const oldX = bullet.x;
        const oldY = bullet.y;

        const newX = bullet.x + Math.cos(bullet.angle) * BULLET_SPEED;
        const newY = bullet.y + Math.sin(bullet.angle) * BULLET_SPEED;

        // Check if bullet path hits a wall (client-side prediction)
        if (bulletHitsWall(oldX, oldY, newX, newY)) {
            // Don't move bullet, server will remove it
            continue;
        }

        bullet.x = newX;
        bullet.y = newY;
    }
}

// Render game
function render() {
    // Clear canvas with map background color
    ctx.fillStyle = currentMap?.backgroundColor || '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Draw obstacles
    drawObstacles();

    // Draw bullets
    for (const id in bullets) {
        drawBullet(bullets[id]);
    }

    // Draw players
    for (const id in players) {
        drawTank(players[id], id === myId);
    }
}

function drawGrid() {
    ctx.strokeStyle = currentMap?.gridColor || '#1a2744';
    ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawObstacles() {
    if (!currentMap || !currentMap.obstacles) return;

    for (const obstacle of currentMap.obstacles) {
        if (obstacle.type === 'wall') {
            // Draw wall
            ctx.fillStyle = '#4a4a5a';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Wall border
            ctx.strokeStyle = '#6a6a7a';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Brick pattern
            ctx.strokeStyle = '#3a3a4a';
            ctx.lineWidth = 1;
            const brickHeight = 10;
            const brickWidth = 20;
            for (let y = obstacle.y; y < obstacle.y + obstacle.height; y += brickHeight) {
                const offset = (Math.floor((y - obstacle.y) / brickHeight) % 2) * (brickWidth / 2);
                for (let x = obstacle.x + offset; x < obstacle.x + obstacle.width; x += brickWidth) {
                    ctx.strokeRect(
                        Math.max(obstacle.x, x),
                        y,
                        Math.min(brickWidth, obstacle.x + obstacle.width - x),
                        Math.min(brickHeight, obstacle.y + obstacle.height - y)
                    );
                }
            }
        } else if (obstacle.type === 'water') {
            // Draw water with wave effect
            ctx.fillStyle = '#1a5f7a';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Wave pattern
            ctx.strokeStyle = '#2980b9';
            ctx.lineWidth = 2;
            const time = Date.now() / 500;
            for (let y = obstacle.y + 10; y < obstacle.y + obstacle.height; y += 15) {
                ctx.beginPath();
                ctx.moveTo(obstacle.x, y);
                for (let x = obstacle.x; x < obstacle.x + obstacle.width; x += 5) {
                    const waveY = y + Math.sin((x + time * 50) / 20) * 3;
                    ctx.lineTo(x, waveY);
                }
                ctx.stroke();
            }

            // Water border
            ctx.strokeStyle = '#0d3d56';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }
}

function drawTank(player, isMe) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Tank body
    ctx.fillStyle = player.color;
    ctx.fillRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);

    // Tank body outline
    ctx.strokeStyle = isMe ? '#fff' : '#000';
    ctx.lineWidth = isMe ? 3 : 2;
    ctx.strokeRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);

    // Tank barrel
    ctx.fillStyle = '#333';
    ctx.fillRect(0, -4, BARREL_LENGTH, 8);

    ctx.restore();

    // Draw player name/health above tank
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    const name = isMe ? 'You' : `Player ${player.id.substr(0, 4)}`;
    ctx.fillText(name, player.x, player.y - TANK_SIZE/2 - 20);

    // Health bar above tank
    const healthBarWidth = 40;
    const healthBarHeight = 4;
    const healthX = player.x - healthBarWidth/2;
    const healthY = player.y - TANK_SIZE/2 - 15;

    ctx.fillStyle = '#333';
    ctx.fillRect(healthX, healthY, healthBarWidth, healthBarHeight);

    const healthPercent = player.health / CONFIG.STARTING_HEALTH;
    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#f44336';
    ctx.fillRect(healthX, healthY, healthBarWidth * healthPercent, healthBarHeight);
}

function drawBullet(bullet) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, BULLET_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// UI updates
function updateUI() {
    if (!myId || !players[myId]) return;

    const player = players[myId];
    document.getElementById('score').textContent = player.score;

    const healthFill = document.getElementById('health-fill');
    healthFill.style.width = player.health + '%';

    if (player.health > 50) {
        healthFill.style.backgroundColor = '#4CAF50';
    } else if (player.health > 25) {
        healthFill.style.backgroundColor = '#FF9800';
    } else {
        healthFill.style.backgroundColor = '#f44336';
    }
}

function updateScoreboard() {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';

    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

    for (const player of sortedPlayers) {
        const div = document.createElement('div');
        div.className = 'player-score';
        div.style.color = player.color;

        const name = player.id === myId ? 'You' : `Player ${player.id.substr(0, 4)}`;
        div.textContent = `${name}: ${player.score}`;

        playerList.appendChild(div);
    }
}

function updateConnectionStatus(connected) {
    const status = document.getElementById('connection-status');
    if (connected) {
        status.textContent = 'Connected';
        status.className = 'connected';
    } else {
        status.textContent = 'Disconnected';
        status.className = 'disconnected';
    }
}

// Game loop
function gameLoop() {
    updatePlayer();
    updateBullets();
    tryShoot();
    render();
    requestAnimationFrame(gameLoop);
}

// Start game when page loads
window.addEventListener('load', init);
