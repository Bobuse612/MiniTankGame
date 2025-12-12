// Map Definitions
// obstacle types: 'wall' (blocks bullets and players), 'water' (blocks only players)

const MAPS = {
    warehouse: {
        name: "Warehouse",
        description: "Industrial corridors with tight corners",
        width: 800,
        height: 600,
        backgroundColor: "#1a1a2e",
        gridColor: "#252540",
        obstacles: [
            // Outer walls
            { type: 'wall', x: 0, y: 0, width: 800, height: 20 },
            { type: 'wall', x: 0, y: 580, width: 800, height: 20 },
            { type: 'wall', x: 0, y: 0, width: 20, height: 600 },
            { type: 'wall', x: 780, y: 0, width: 20, height: 600 },

            // Center cross structure
            { type: 'wall', x: 350, y: 200, width: 100, height: 20 },
            { type: 'wall', x: 350, y: 380, width: 100, height: 20 },
            { type: 'wall', x: 200, y: 250, width: 20, height: 100 },
            { type: 'wall', x: 580, y: 250, width: 20, height: 100 },

            // Corner blocks
            { type: 'wall', x: 100, y: 100, width: 80, height: 80 },
            { type: 'wall', x: 620, y: 100, width: 80, height: 80 },
            { type: 'wall', x: 100, y: 420, width: 80, height: 80 },
            { type: 'wall', x: 620, y: 420, width: 80, height: 80 },

            // Side corridors
            { type: 'wall', x: 250, y: 50, width: 20, height: 100 },
            { type: 'wall', x: 530, y: 50, width: 20, height: 100 },
            { type: 'wall', x: 250, y: 450, width: 20, height: 100 },
            { type: 'wall', x: 530, y: 450, width: 20, height: 100 },
        ],
        spawnPoints: [
            { x: 60, y: 300 },
            { x: 740, y: 300 },
            { x: 400, y: 60 },
            { x: 400, y: 540 }
        ]
    },

    island: {
        name: "Island",
        description: "Water surrounds a central battle arena",
        width: 800,
        height: 600,
        backgroundColor: "#0a2a3a",
        gridColor: "#0d3347",
        obstacles: [
            // Water borders (L-shaped corners)
            { type: 'water', x: 0, y: 0, width: 150, height: 150 },
            { type: 'water', x: 650, y: 0, width: 150, height: 150 },
            { type: 'water', x: 0, y: 450, width: 150, height: 150 },
            { type: 'water', x: 650, y: 450, width: 150, height: 150 },

            // Water channels
            { type: 'water', x: 300, y: 0, width: 200, height: 50 },
            { type: 'water', x: 300, y: 550, width: 200, height: 50 },
            { type: 'water', x: 0, y: 250, width: 50, height: 100 },
            { type: 'water', x: 750, y: 250, width: 50, height: 100 },

            // Center island walls
            { type: 'wall', x: 370, y: 270, width: 60, height: 60 },

            // Bridge pillars (walls)
            { type: 'wall', x: 180, y: 180, width: 40, height: 40 },
            { type: 'wall', x: 580, y: 180, width: 40, height: 40 },
            { type: 'wall', x: 180, y: 380, width: 40, height: 40 },
            { type: 'wall', x: 580, y: 380, width: 40, height: 40 },

            // Small cover walls
            { type: 'wall', x: 250, y: 280, width: 50, height: 20 },
            { type: 'wall', x: 500, y: 300, width: 50, height: 20 },
            { type: 'wall', x: 380, y: 150, width: 20, height: 50 },
            { type: 'wall', x: 380, y: 400, width: 20, height: 50 },
        ],
        spawnPoints: [
            { x: 100, y: 300 },
            { x: 700, y: 300 },
            { x: 400, y: 100 },
            { x: 400, y: 500 }
        ]
    },

    battlefield: {
        name: "Battlefield",
        description: "Large open map with scattered cover",
        width: 1200,
        height: 800,
        backgroundColor: "#1a2a1a",
        gridColor: "#253525",
        obstacles: [
            // Outer walls
            { type: 'wall', x: 0, y: 0, width: 1200, height: 20 },
            { type: 'wall', x: 0, y: 780, width: 1200, height: 20 },
            { type: 'wall', x: 0, y: 0, width: 20, height: 800 },
            { type: 'wall', x: 1180, y: 0, width: 20, height: 800 },

            // Central fortress
            { type: 'wall', x: 550, y: 350, width: 100, height: 100 },

            // North bunkers
            { type: 'wall', x: 200, y: 100, width: 80, height: 60 },
            { type: 'wall', x: 450, y: 80, width: 60, height: 80 },
            { type: 'wall', x: 700, y: 100, width: 80, height: 60 },
            { type: 'wall', x: 920, y: 80, width: 60, height: 80 },

            // South bunkers
            { type: 'wall', x: 200, y: 640, width: 80, height: 60 },
            { type: 'wall', x: 450, y: 640, width: 60, height: 80 },
            { type: 'wall', x: 700, y: 640, width: 80, height: 60 },
            { type: 'wall', x: 920, y: 640, width: 60, height: 80 },

            // West trenches (water)
            { type: 'water', x: 100, y: 300, width: 60, height: 200 },
            { type: 'wall', x: 80, y: 380, width: 100, height: 40 },

            // East trenches (water)
            { type: 'water', x: 1040, y: 300, width: 60, height: 200 },
            { type: 'wall', x: 1020, y: 380, width: 100, height: 40 },

            // Scattered cover - left side
            { type: 'wall', x: 300, y: 250, width: 40, height: 80 },
            { type: 'wall', x: 300, y: 470, width: 40, height: 80 },

            // Scattered cover - right side
            { type: 'wall', x: 860, y: 250, width: 40, height: 80 },
            { type: 'wall', x: 860, y: 470, width: 40, height: 80 },

            // Mid barriers
            { type: 'wall', x: 420, y: 300, width: 20, height: 60 },
            { type: 'wall', x: 420, y: 440, width: 20, height: 60 },
            { type: 'wall', x: 760, y: 300, width: 20, height: 60 },
            { type: 'wall', x: 760, y: 440, width: 20, height: 60 },

            // Water pools
            { type: 'water', x: 500, y: 200, width: 80, height: 60 },
            { type: 'water', x: 620, y: 540, width: 80, height: 60 },
        ],
        spawnPoints: [
            { x: 100, y: 100 },
            { x: 1100, y: 100 },
            { x: 100, y: 700 },
            { x: 1100, y: 700 },
            { x: 600, y: 100 },
            { x: 600, y: 700 }
        ]
    }
};

// Export for Node.js (server) or make global for browser (client)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MAPS;
}
