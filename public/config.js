// Game Configuration
// Shared between server and client

const CONFIG = {
    // Room settings
    MAX_PLAYERS: 4,
    MAX_BOTS: 3,

    // Keyboard layout: 'azerty' or 'qwerty'
    DEFAULT_KEYBOARD: 'azerty',

    // Tank properties
    TANK_SIZE: 30,
    BARREL_LENGTH: 20,
    TANK_COLORS: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'],

    // Tank movement (momentum-based)
    ACCELERATION: 0.5,
    FRICTION: 0.92,
    MAX_SPEED: 5,
    WALL_BOUNCE: 0.5,

    // Bullet properties
    BULLET_SIZE: 5,
    BULLET_SPEED: 10,
    BULLET_LIFETIME: 2000,  // ms

    // Combat
    SHOOT_COOLDOWN: 300,    // ms
    BULLET_DAMAGE: 25,
    STARTING_HEALTH: 100,

    // Server
    PORT: 3000,
    TICK_RATE: 60           // Server updates per second
};

// Export for Node.js (server) or make global for browser (client)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
