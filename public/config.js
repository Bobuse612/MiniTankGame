// Game Configuration
// Shared between server and client

const CONFIG = {
    // Room settings
    MAX_PLAYERS: 4,
    MAX_BOTS: 3,
    MIN_PLAYERS_TO_START: 1,  // Minimum players (including bots) to start
    WIN_SCORE: 10,            // Points needed to win

    // Keyboard layout: 'azerty' or 'qwerty'
    DEFAULT_KEYBOARD: 'azerty',

    // Tank properties
    TANK_SIZE: 30,
    BARREL_LENGTH: 20,
    TANK_COLORS: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'],

    // Base tank movement (momentum-based)
    ACCELERATION: 0.4,
    FRICTION: 0.92,
    MAX_SPEED: 4,
    WALL_BOUNCE: 0.5,

    // Base bullet properties
    BULLET_SIZE: 5,
    BULLET_LIFETIME: 2000,  // ms

    // Base combat
    STARTING_HEALTH: 100,

    // Tank Classes
    TANK_CLASSES: {
        speedo: {
            name: 'Speedo',
            description: 'Balanced tank with speed boost',
            bulletSpeed: 10,
            bulletDamage: 25,
            shootCooldown: 300,     // ms
            bulletSpread: 0,        // degrees
            // Speed boost ability (hold space)
            boostCooldown: 3000,    // ms cooldown after boost ends
            boostDuration: 2000,    // ms - how long boost lasts
            boostSpeedMultiplier: 2 // speed multiplier during boost
        },
        sniper: {
            name: 'Sniper',
            description: 'Slow fire, fast bullets, high damage',
            bulletSpeed: 18,
            bulletDamage: 100,
            shootCooldown: 1200,    // ms
            bulletSpread: 0,        // degrees
            boostCooldown: 0,
            boostDuration: 0,
            boostSpeedMultiplier: 1
        },
        gatling: {
            name: 'Gatling',
            description: 'Rapid fire with slight spread',
            bulletSpeed: 8,
            bulletDamage: 15,
            shootCooldown: 100,     // ms
            bulletSpread: 3,        // degrees (+/- random)
            boostCooldown: 0,
            boostDuration: 0,
            boostSpeedMultiplier: 1
        },
        shotgun: {
            name: 'Shotgun',
            description: 'Fires 5 bullets in a spread pattern',
            bulletSpeed: 12,
            bulletDamage: 20,
            shootCooldown: 800,     // ms - slower fire rate
            bulletSpread: 0,        // Not used, has fixed pattern
            bulletCount: 5,         // Number of bullets per shot
            spreadAngle: 30,        // Total spread angle in degrees
            boostCooldown: 0,
            boostDuration: 0,
            boostSpeedMultiplier: 1
        }
    },

    // Server
    PORT: 3000,
    TICK_RATE: 60           // Server updates per second
};

// Export for Node.js (server) or make global for browser (client)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
