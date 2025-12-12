const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const CONFIG = require('./public/config.js');
const MAPS = require('./public/maps.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || CONFIG.PORT;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game rooms storage
const rooms = {};

// Bot names
const BOT_NAMES = ['Bot Alpha', 'Bot Bravo', 'Bot Charlie', 'Bot Delta', 'Bot Echo'];

function getRandomColor() {
    return CONFIG.TANK_COLORS[Math.floor(Math.random() * CONFIG.TANK_COLORS.length)];
}

function getRandomSpawn(mapId) {
    const map = MAPS[mapId];
    if (map && map.spawnPoints && map.spawnPoints.length > 0) {
        const spawn = map.spawnPoints[Math.floor(Math.random() * map.spawnPoints.length)];
        return { x: spawn.x, y: spawn.y };
    }
    // Fallback
    const width = map?.width || 800;
    const height = map?.height || 600;
    return {
        x: Math.random() * (width - CONFIG.TANK_SIZE * 2) + CONFIG.TANK_SIZE,
        y: Math.random() * (height - CONFIG.TANK_SIZE * 2) + CONFIG.TANK_SIZE
    };
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateBotId() {
    return 'bot_' + Math.random().toString(36).substring(2, 8);
}

// Check collision with obstacle
function checkObstacleCollision(x, y, radius, obstacle) {
    const closestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
    const closestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));
    const dx = x - closestX;
    const dy = y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius;
}

// Check if position collides with any obstacle of given types
function collidesWithObstacles(x, y, radius, obstacles, types) {
    for (const obstacle of obstacles) {
        if (types.includes(obstacle.type)) {
            if (checkObstacleCollision(x, y, radius, obstacle)) {
                return obstacle;
            }
        }
    }
    return null;
}

// Check if a line segment intersects a rectangle (for bullet trajectory)
function lineIntersectsRect(x1, y1, x2, y2, rect) {
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    if ((x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) ||
        (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom)) {
        return true;
    }

    if (lineIntersectsLine(x1, y1, x2, y2, left, top, right, top)) return true;
    if (lineIntersectsLine(x1, y1, x2, y2, left, bottom, right, bottom)) return true;
    if (lineIntersectsLine(x1, y1, x2, y2, left, top, left, bottom)) return true;
    if (lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom)) return true;

    return false;
}

// Check if two line segments intersect
function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 0.0001) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

// Check if bullet path collides with walls
function bulletPathCollidesWithWall(oldX, oldY, newX, newY, obstacles) {
    for (const obstacle of obstacles) {
        if (obstacle.type === 'wall') {
            if (lineIntersectsRect(oldX, oldY, newX, newY, obstacle)) {
                return true;
            }
        }
    }
    return false;
}

// Create a bot player
function createBot(room, botIndex) {
    const botId = generateBotId();
    const spawn = getRandomSpawn(room.mapId);
    const bot = {
        id: botId,
        name: BOT_NAMES[botIndex % BOT_NAMES.length],
        x: spawn.x,
        y: spawn.y,
        angle: Math.random() * Math.PI * 2,
        color: getRandomColor(),
        score: 0,
        health: CONFIG.STARTING_HEALTH,
        isBot: true,
        // Bot AI state
        targetId: null,
        lastShot: 0,
        moveDirection: Math.random() * Math.PI * 2,
        moveTimer: 0
    };
    room.players[botId] = bot;
    room.bots.push(botId);
    return bot;
}

// Bot AI logic
function updateBot(bot, room) {
    const map = MAPS[room.mapId];
    const mapWidth = map?.width || 800;
    const mapHeight = map?.height || 600;
    const obstacles = map?.obstacles || [];
    const now = Date.now();

    // Find nearest enemy (non-bot player or other bot)
    let nearestEnemy = null;
    let nearestDist = Infinity;

    for (const playerId in room.players) {
        if (playerId === bot.id) continue;
        const player = room.players[playerId];
        const dx = player.x - bot.x;
        const dy = player.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = player;
        }
    }

    // Change direction periodically or when stuck
    bot.moveTimer--;
    if (bot.moveTimer <= 0) {
        bot.moveDirection = Math.random() * Math.PI * 2;
        bot.moveTimer = 60 + Math.random() * 120; // 1-3 seconds
    }

    // Move towards enemy if found, otherwise wander
    let targetAngle = bot.moveDirection;
    if (nearestEnemy && nearestDist < 400) {
        targetAngle = Math.atan2(nearestEnemy.y - bot.y, nearestEnemy.x - bot.x);
    }

    // Calculate new position
    const speed = CONFIG.MAX_SPEED * 0.6; // Bots are slightly slower
    let newX = bot.x + Math.cos(targetAngle) * speed;
    let newY = bot.y + Math.sin(targetAngle) * speed;

    // Clamp to bounds
    newX = Math.max(CONFIG.TANK_SIZE, Math.min(mapWidth - CONFIG.TANK_SIZE, newX));
    newY = Math.max(CONFIG.TANK_SIZE, Math.min(mapHeight - CONFIG.TANK_SIZE, newY));

    // Check collision
    if (!collidesWithObstacles(newX, newY, CONFIG.TANK_SIZE / 2, obstacles, ['wall', 'water'])) {
        bot.x = newX;
        bot.y = newY;
    } else {
        // Change direction if stuck
        bot.moveDirection = Math.random() * Math.PI * 2;
        bot.moveTimer = 30;
    }

    // Aim at nearest enemy
    if (nearestEnemy) {
        bot.angle = Math.atan2(nearestEnemy.y - bot.y, nearestEnemy.x - bot.x);

        // Shoot if enemy in range and cooldown passed
        if (nearestDist < 350 && now - bot.lastShot > CONFIG.SHOOT_COOLDOWN + 200) {
            bot.lastShot = now;

            const bullet = {
                id: now + '-' + bot.id,
                ownerId: bot.id,
                x: bot.x + Math.cos(bot.angle) * CONFIG.BARREL_LENGTH,
                y: bot.y + Math.sin(bot.angle) * CONFIG.BARREL_LENGTH,
                angle: bot.angle,
                createdAt: now
            };
            room.bullets.push(bullet);
            io.to(room.id).emit('bulletFired', bullet);
        }
    }

    // Broadcast bot movement
    io.to(room.id).emit('playerMoved', {
        id: bot.id,
        x: bot.x,
        y: bot.y,
        angle: bot.angle
    });
}

// Get player count (excluding bots)
function getHumanPlayerCount(room) {
    let count = 0;
    for (const playerId in room.players) {
        if (!room.players[playerId].isBot) {
            count++;
        }
    }
    return count;
}

// Broadcast lobby update to all clients not in a room
function broadcastLobbyUpdate() {
    const lobbyData = {};
    for (const roomId in rooms) {
        const room = rooms[roomId];
        const humanCount = getHumanPlayerCount(room);
        lobbyData[roomId] = {
            id: roomId,
            name: room.name,
            mapId: room.mapId,
            mapName: MAPS[room.mapId]?.name || room.mapId,
            playerCount: humanCount,
            botCount: room.bots.length,
            maxPlayers: CONFIG.MAX_PLAYERS,
            isFull: humanCount >= CONFIG.MAX_PLAYERS
        };
    }
    io.to('lobby').emit('lobbyUpdate', lobbyData);
}

// Delete empty room (no human players)
function checkAndDeleteRoom(roomId) {
    const room = rooms[roomId];
    if (room && getHumanPlayerCount(room) === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted (empty)`);
        broadcastLobbyUpdate();
    }
}

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join lobby by default
    socket.join('lobby');

    // Get lobby data
    socket.on('getLobby', () => {
        broadcastLobbyUpdate();
    });

    // Create a new game room
    socket.on('createGame', (data, callback) => {
        const { name, map, botCount } = data;

        if (!name || name.trim().length === 0) {
            return callback({ success: false, error: 'Game name is required' });
        }

        if (!MAPS[map]) {
            return callback({ success: false, error: 'Invalid map selected' });
        }

        const numBots = Math.min(Math.max(0, parseInt(botCount) || 0), CONFIG.MAX_BOTS);

        const roomId = generateRoomId();
        rooms[roomId] = {
            id: roomId,
            name: name.trim().substring(0, 20),
            mapId: map,
            players: {},
            bullets: [],
            bots: []
        };

        // Add bots
        for (let i = 0; i < numBots; i++) {
            createBot(rooms[roomId], i);
        }

        console.log(`Room ${roomId} created: "${name}" on map "${map}" with ${numBots} bots`);
        broadcastLobbyUpdate();

        callback({ success: true, roomId });
    });

    // Join a game room
    socket.on('joinRoom', (roomId, callback) => {
        const room = rooms[roomId];

        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }

        // Check if room is full
        if (getHumanPlayerCount(room) >= CONFIG.MAX_PLAYERS) {
            return callback({ success: false, error: 'Room is full' });
        }

        // Leave lobby
        socket.leave('lobby');

        // Join the room
        socket.join(roomId);
        socket.roomId = roomId;

        // Get map dimensions
        const map = MAPS[room.mapId];
        const mapWidth = map?.width || 800;
        const mapHeight = map?.height || 600;

        // Create player
        const spawn = getRandomSpawn(room.mapId);
        room.players[socket.id] = {
            id: socket.id,
            x: spawn.x,
            y: spawn.y,
            angle: 0,
            color: getRandomColor(),
            score: 0,
            health: CONFIG.STARTING_HEALTH,
            isBot: false
        };

        console.log(`Player ${socket.id} joined room ${roomId}`);

        // Send game state to player
        callback({
            success: true,
            playerId: socket.id,
            players: room.players,
            mapId: room.mapId,
            map: MAPS[room.mapId],
            roomName: room.name,
            gameWidth: mapWidth,
            gameHeight: mapHeight
        });

        // Notify other players
        socket.to(roomId).emit('playerJoined', room.players[socket.id]);
        broadcastLobbyUpdate();
    });

    // Leave room
    socket.on('leaveRoom', () => {
        if (socket.roomId) {
            const roomId = socket.roomId;
            const room = rooms[roomId];

            if (room && room.players[socket.id]) {
                delete room.players[socket.id];
                socket.to(roomId).emit('playerLeft', socket.id);
            }

            socket.leave(roomId);
            socket.roomId = null;
            socket.join('lobby');

            checkAndDeleteRoom(roomId);
        }
    });

    // Handle player movement
    socket.on('move', (data) => {
        if (!socket.roomId) return;
        const room = rooms[socket.roomId];
        if (!room || !room.players[socket.id]) return;

        const player = room.players[socket.id];
        const map = MAPS[room.mapId];
        const mapWidth = map?.width || 800;
        const mapHeight = map?.height || 600;
        const obstacles = map?.obstacles || [];

        // Check new position
        let newX = Math.max(CONFIG.TANK_SIZE / 2, Math.min(mapWidth - CONFIG.TANK_SIZE / 2, data.x));
        let newY = Math.max(CONFIG.TANK_SIZE / 2, Math.min(mapHeight - CONFIG.TANK_SIZE / 2, data.y));

        // Check collision with walls and water
        const collision = collidesWithObstacles(newX, newY, CONFIG.TANK_SIZE / 2, obstacles, ['wall', 'water']);

        if (!collision) {
            player.x = newX;
            player.y = newY;
        }
        player.angle = data.angle;

        socket.to(socket.roomId).emit('playerMoved', {
            id: socket.id,
            x: player.x,
            y: player.y,
            angle: player.angle
        });
    });

    // Handle shooting
    socket.on('shoot', (data) => {
        if (!socket.roomId) return;
        const room = rooms[socket.roomId];
        if (!room) return;

        const bullet = {
            id: Date.now() + '-' + socket.id,
            ownerId: socket.id,
            x: data.x,
            y: data.y,
            angle: data.angle,
            createdAt: Date.now()
        };
        room.bullets.push(bullet);
        io.to(socket.roomId).emit('bulletFired', bullet);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        if (socket.roomId) {
            const roomId = socket.roomId;
            const room = rooms[roomId];

            if (room && room.players[socket.id]) {
                delete room.players[socket.id];
                io.to(roomId).emit('playerLeft', socket.id);
            }

            checkAndDeleteRoom(roomId);
        }
    });
});

// Game loop for all rooms
setInterval(() => {
    const now = Date.now();

    for (const roomId in rooms) {
        const room = rooms[roomId];
        const map = MAPS[room.mapId];
        const mapWidth = map?.width || 800;
        const mapHeight = map?.height || 600;
        const obstacles = map?.obstacles || [];

        // Update bots
        for (const botId of room.bots) {
            const bot = room.players[botId];
            if (bot) {
                updateBot(bot, room);
            }
        }

        // Update bullets
        for (let i = room.bullets.length - 1; i >= 0; i--) {
            const bullet = room.bullets[i];

            const oldX = bullet.x;
            const oldY = bullet.y;

            bullet.x += Math.cos(bullet.angle) * CONFIG.BULLET_SPEED;
            bullet.y += Math.sin(bullet.angle) * CONFIG.BULLET_SPEED;

            // Check if bullet path intersects a wall
            if (bulletPathCollidesWithWall(oldX, oldY, bullet.x, bullet.y, obstacles)) {
                room.bullets.splice(i, 1);
                io.to(roomId).emit('bulletRemoved', bullet.id);
                continue;
            }

            // Check if bullet is out of bounds or expired
            if (bullet.x < 0 || bullet.x > mapWidth ||
                bullet.y < 0 || bullet.y > mapHeight ||
                now - bullet.createdAt > CONFIG.BULLET_LIFETIME) {
                room.bullets.splice(i, 1);
                io.to(roomId).emit('bulletRemoved', bullet.id);
                continue;
            }

            // Check collision with players
            for (const playerId in room.players) {
                if (playerId === bullet.ownerId) continue;

                const player = room.players[playerId];
                const dx = bullet.x - player.x;
                const dy = bullet.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CONFIG.TANK_SIZE / 2) {
                    player.health -= CONFIG.BULLET_DAMAGE;
                    room.bullets.splice(i, 1);
                    io.to(roomId).emit('bulletRemoved', bullet.id);
                    io.to(roomId).emit('playerHit', { playerId, health: player.health });

                    if (player.health <= 0) {
                        if (room.players[bullet.ownerId]) {
                            room.players[bullet.ownerId].score += 1;
                            io.to(roomId).emit('scoreUpdate', {
                                playerId: bullet.ownerId,
                                score: room.players[bullet.ownerId].score
                            });
                        }

                        // Respawn player
                        const spawn = getRandomSpawn(room.mapId);
                        player.x = spawn.x;
                        player.y = spawn.y;
                        player.health = CONFIG.STARTING_HEALTH;
                        io.to(roomId).emit('playerRespawned', player);
                    }
                    break;
                }
            }
        }
    }
}, 1000 / CONFIG.TICK_RATE);

server.listen(PORT, () => {
    console.log(`Tank Battle 2D server running on http://localhost:${PORT}`);
});
