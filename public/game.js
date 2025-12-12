// Game constants (from CONFIG)
const TANK_SIZE = CONFIG.TANK_SIZE;
const BARREL_LENGTH = CONFIG.BARREL_LENGTH;
const BULLET_SIZE = CONFIG.BULLET_SIZE;

// Movement physics (from CONFIG)
const ACCELERATION = CONFIG.ACCELERATION;
const FRICTION = CONFIG.FRICTION;
const MAX_SPEED = CONFIG.MAX_SPEED;

// Keyboard layout setting
let keyboardLayout = CONFIG.DEFAULT_KEYBOARD;

// Tank class selection
let selectedClass = 'speedo';
let myTankClass = 'speedo';

// Speed boost ability state (for speedo class)
let isBoosting = false;
let boostEndTime = 0;
let boostCooldownEnd = 0;
let spaceKeyDown = false;

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
let gameState = 'waiting'; // 'waiting', 'playing', 'ended'
let gameLoopStarted = false;

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

    // Setup class selection UI
    setupClassSelection();

    // Connect to server
    socket = io();

    setupInputEvents();
    updateKeyboardDisplay();
}

// Setup class selection
function setupClassSelection() {
    const overlay = document.getElementById('class-select-overlay');
    const joinBtn = document.getElementById('join-game-btn');
    const classCards = document.querySelectorAll('.class-card');

    // Class card selection
    classCards.forEach(card => {
        card.addEventListener('click', () => {
            classCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedClass = card.dataset.class;
        });
    });

    // Join game button
    joinBtn.addEventListener('click', () => {
        myTankClass = selectedClass;
        overlay.style.display = 'none';

        // Show boost UI only for speedo class
        if (myTankClass === 'speedo') {
            document.getElementById('boost-cooldown').style.display = 'block';
            document.getElementById('boost-text').style.display = 'inline';
        }

        // Setup socket events and join room
        setupSocketEvents();

        // If already connected, join immediately
        if (socket.connected) {
            joinRoom();
        }
    });
}

// Join the room
function joinRoom() {
    socket.emit('joinRoom', { roomId, tankClass: myTankClass }, (response) => {
        if (response.success) {
            myId = response.playerId;
            players = response.players;
            currentMap = response.map;
            gameWidth = response.gameWidth;
            gameHeight = response.gameHeight;
            gameState = response.gameState || 'waiting';

            // Resize canvas to match map dimensions
            canvas.width = gameWidth;
            canvas.height = gameHeight;

            // Update room name display
            document.getElementById('room-name').textContent = response.roomName;

            // Update min players display
            const minPlayersDisplay = document.getElementById('min-players-display');
            if (minPlayersDisplay) {
                minPlayersDisplay.textContent = CONFIG.MIN_PLAYERS_TO_START;
            }

            updateUI();
            updateScoreboard();
            updateWaitScreen();

            // Start game loop if not already started
            if (!gameLoopStarted) {
                gameLoopStarted = true;
                requestAnimationFrame(gameLoop);
            }
        } else {
            alert(response.error || 'Failed to join room');
            window.location.href = '/';
        }
    });
}

// Setup socket event handlers
function setupSocketEvents() {
    socket.on('connect', () => {
        updateConnectionStatus(true);
        // Join room on connect (for reconnects)
        if (!myId) {
            joinRoom();
        }
    });

    socket.on('disconnect', () => {
        updateConnectionStatus(false);
    });

    socket.on('playerJoined', (player) => {
        players[player.id] = player;
        updateScoreboard();
        updateWaitScreen();
    });

    socket.on('playerLeft', (playerId) => {
        delete players[playerId];
        updateScoreboard();
        updateWaitScreen();
    });

    socket.on('gameStarted', () => {
        gameState = 'playing';
        updateWaitScreen();
    });

    socket.on('gameWon', (data) => {
        gameState = 'ended';
        showWinnerScreen(data.winnerId, data.winnerName, data.scores);
    });

    socket.on('gameReset', () => {
        gameState = 'waiting';
        // Reset all scores locally
        for (const id in players) {
            players[id].score = 0;
        }
        updateScoreboard();
        updateWaitScreen();
        hideWinnerScreen();
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

    // Space key for speed boost (Speedo class)
    if (key === ' ') {
        spaceKeyDown = isPressed;
    }

    // Arrow keys for shooting
    switch (key) {
        case 'ArrowUp': shootKeys.up = isPressed; break;
        case 'ArrowDown': shootKeys.down = isPressed; break;
        case 'ArrowLeft': shootKeys.left = isPressed; break;
        case 'ArrowRight': shootKeys.right = isPressed; break;
    }
}

// Get current speed multiplier based on boost state
function getSpeedMultiplier() {
    if (myTankClass !== 'speedo') return 1;
    if (!isBoosting) return 1;
    return CONFIG.TANK_CLASSES.speedo.boostSpeedMultiplier;
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

function getShootCooldown() {
    const classConfig = CONFIG.TANK_CLASSES[myTankClass] || CONFIG.TANK_CLASSES.speedo;
    return classConfig.shootCooldown;
}

function shoot(angle) {
    const now = Date.now();
    if (now - lastShot < getShootCooldown()) return;
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

    // Get speed multiplier (for Speedo boost)
    const speedMultiplier = getSpeedMultiplier();
    const currentMaxSpeed = MAX_SPEED * speedMultiplier;

    // Clamp velocity to max speed
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (speed > currentMaxSpeed) {
        velocityX = (velocityX / speed) * currentMaxSpeed;
        velocityY = (velocityY / speed) * currentMaxSpeed;
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

        // Use bullet-specific speed (fallback to default)
        const bulletSpeed = bullet.speed || CONFIG.TANK_CLASSES.speedo.bulletSpeed;
        const newX = bullet.x + Math.cos(bullet.angle) * bulletSpeed;
        const newY = bullet.y + Math.sin(bullet.angle) * bulletSpeed;

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
    const winScoreEl = document.getElementById('win-score');

    if (winScoreEl) {
        winScoreEl.textContent = CONFIG.WIN_SCORE;
    }

    playerList.innerHTML = '';

    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

    for (const player of sortedPlayers) {
        const div = document.createElement('div');
        div.className = 'player-score';
        div.style.color = player.color;

        const name = player.id === myId ? 'You' : (player.isBot ? player.name : `Player ${player.id.substr(0, 4)}`);
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
    // Only update game logic when playing
    if (gameState === 'playing') {
        updateBoostState();
        updatePlayer();
        updateBullets();
        tryShoot();
        updateBoostUI();
    }

    // Always render
    render();
    requestAnimationFrame(gameLoop);
}

// Update boost state based on space key and cooldown
function updateBoostState() {
    if (myTankClass !== 'speedo') return;

    const now = Date.now();
    const classConfig = CONFIG.TANK_CLASSES.speedo;

    // Check if we can start boosting
    if (spaceKeyDown && !isBoosting && now >= boostCooldownEnd) {
        isBoosting = true;
        boostEndTime = now + classConfig.boostDuration;
    }

    // Check if boost should end (duration over or key released)
    if (isBoosting) {
        if (!spaceKeyDown || now >= boostEndTime) {
            isBoosting = false;
            boostCooldownEnd = now + classConfig.boostCooldown;
        }
    }
}

// Update boost cooldown UI
function updateBoostUI() {
    if (myTankClass !== 'speedo') return;

    const boostFill = document.getElementById('boost-fill');
    const boostCooldownDiv = document.getElementById('boost-cooldown');
    if (!boostFill) return;

    const classConfig = CONFIG.TANK_CLASSES.speedo;
    const now = Date.now();

    if (isBoosting) {
        // Show remaining boost duration
        const remaining = boostEndTime - now;
        const percent = (remaining / classConfig.boostDuration) * 100;
        boostFill.style.width = percent + '%';
        boostFill.style.background = '#00BFFF'; // Blue when boosting
        if (boostCooldownDiv) boostCooldownDiv.classList.add('boosting');
    } else {
        // Show cooldown progress
        const cooldownRemaining = boostCooldownEnd - now;
        if (cooldownRemaining > 0) {
            const percent = 100 - (cooldownRemaining / classConfig.boostCooldown) * 100;
            boostFill.style.width = percent + '%';
            boostFill.style.background = '#FFD700'; // Yellow when on cooldown
        } else {
            boostFill.style.width = '100%';
            boostFill.style.background = '#4CAF50'; // Green when ready
        }
        if (boostCooldownDiv) boostCooldownDiv.classList.remove('boosting');
    }
}

// Wait screen functions
function updateWaitScreen() {
    const waitOverlay = document.getElementById('wait-overlay');
    const playerCountDisplay = document.getElementById('player-count-display');
    const waitPlayersDiv = document.getElementById('wait-players');

    const playerCount = Object.keys(players).length;
    const minPlayers = CONFIG.MIN_PLAYERS_TO_START;

    if (gameState === 'waiting' && playerCount < minPlayers) {
        waitOverlay.style.display = 'flex';

        // Update player count
        if (playerCountDisplay) {
            playerCountDisplay.textContent = playerCount;
        }

        // Update player list
        if (waitPlayersDiv) {
            waitPlayersDiv.innerHTML = '';
            for (const id in players) {
                const player = players[id];
                const div = document.createElement('div');
                div.className = 'wait-player';
                div.style.color = player.color;
                const name = id === myId ? 'You' : (player.isBot ? player.name : `Player ${id.substr(0, 4)}`);
                div.textContent = name;
                waitPlayersDiv.appendChild(div);
            }
        }
    } else {
        waitOverlay.style.display = 'none';
    }
}

// Winner screen functions
function showWinnerScreen(winnerId, winnerName, scores) {
    const winnerOverlay = document.getElementById('winner-overlay');
    const winnerNameDiv = document.getElementById('winner-name');
    const finalScoreList = document.getElementById('final-score-list');

    winnerOverlay.style.display = 'flex';

    // Show winner name
    const isMe = winnerId === myId;
    winnerNameDiv.textContent = isMe ? 'You win!' : `${winnerName} wins!`;
    winnerNameDiv.style.color = isMe ? '#FFD700' : '#4CAF50';

    // Show final scores
    if (finalScoreList && scores) {
        finalScoreList.innerHTML = '';
        const sortedScores = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);

        for (const [id, data] of sortedScores) {
            const div = document.createElement('div');
            div.className = 'final-score-item' + (id === winnerId ? ' winner' : '');
            const name = id === myId ? 'You' : data.name;
            div.textContent = `${name}: ${data.score}`;
            finalScoreList.appendChild(div);
        }
    }
}

function hideWinnerScreen() {
    const winnerOverlay = document.getElementById('winner-overlay');
    winnerOverlay.style.display = 'none';
}

function playAgain() {
    // Go back to lobby
    window.location.href = '/';
}

// Start game when page loads
window.addEventListener('load', init);
