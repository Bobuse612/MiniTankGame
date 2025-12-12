// Map Definitions
// obstacle types: 'wall' (blocks bullets and players), 'water' (blocks only players)

const MAPS = {
    warehouse: {
        name: "Warehouse",
        description: "Industrial corridors with tight corners",
        width: 1000,
        height: 750,
        backgroundColor: "#1a1a2e",
        gridColor: "#252540",
        obstacles: [
            // Outer walls
            { type: 'wall', x: 0, y: 0, width: 1000, height: 20 },
            { type: 'wall', x: 0, y: 730, width: 1000, height: 20 },
            { type: 'wall', x: 0, y: 0, width: 20, height: 750 },
            { type: 'wall', x: 980, y: 0, width: 20, height: 750 },

            // Center cross structure
            { type: 'wall', x: 440, y: 250, width: 120, height: 20 },
            { type: 'wall', x: 440, y: 480, width: 120, height: 20 },
            { type: 'wall', x: 250, y: 310, width: 20, height: 130 },
            { type: 'wall', x: 730, y: 310, width: 20, height: 130 },

            // Corner blocks
            { type: 'wall', x: 125, y: 125, width: 100, height: 100 },
            { type: 'wall', x: 775, y: 125, width: 100, height: 100 },
            { type: 'wall', x: 125, y: 525, width: 100, height: 100 },
            { type: 'wall', x: 775, y: 525, width: 100, height: 100 },

            // Side corridors
            { type: 'wall', x: 310, y: 60, width: 20, height: 130 },
            { type: 'wall', x: 670, y: 60, width: 20, height: 130 },
            { type: 'wall', x: 310, y: 560, width: 20, height: 130 },
            { type: 'wall', x: 670, y: 560, width: 20, height: 130 },

            // Additional cover
            { type: 'wall', x: 480, y: 100, width: 40, height: 80 },
            { type: 'wall', x: 480, y: 570, width: 40, height: 80 },
        ],
        spawnPoints: [
            { x: 75, y: 375 },
            { x: 925, y: 375 },
            { x: 500, y: 75 },
            { x: 500, y: 675 }
        ]
    },

    island: {
        name: "Island",
        description: "Water surrounds a central battle arena",
        width: 1000,
        height: 750,
        backgroundColor: "#0a2a3a",
        gridColor: "#0d3347",
        obstacles: [
            // Water borders (L-shaped corners)
            { type: 'water', x: 0, y: 0, width: 190, height: 190 },
            { type: 'water', x: 810, y: 0, width: 190, height: 190 },
            { type: 'water', x: 0, y: 560, width: 190, height: 190 },
            { type: 'water', x: 810, y: 560, width: 190, height: 190 },

            // Water channels
            { type: 'water', x: 375, y: 0, width: 250, height: 60 },
            { type: 'water', x: 375, y: 690, width: 250, height: 60 },
            { type: 'water', x: 0, y: 310, width: 60, height: 130 },
            { type: 'water', x: 940, y: 310, width: 60, height: 130 },

            // Center island walls
            { type: 'wall', x: 460, y: 335, width: 80, height: 80 },

            // Bridge pillars (walls)
            { type: 'wall', x: 225, y: 225, width: 50, height: 50 },
            { type: 'wall', x: 725, y: 225, width: 50, height: 50 },
            { type: 'wall', x: 225, y: 475, width: 50, height: 50 },
            { type: 'wall', x: 725, y: 475, width: 50, height: 50 },

            // Small cover walls
            { type: 'wall', x: 310, y: 350, width: 60, height: 25 },
            { type: 'wall', x: 630, y: 375, width: 60, height: 25 },
            { type: 'wall', x: 475, y: 190, width: 25, height: 60 },
            { type: 'wall', x: 475, y: 500, width: 25, height: 60 },

            // Additional cover
            { type: 'wall', x: 350, y: 250, width: 30, height: 50 },
            { type: 'wall', x: 620, y: 450, width: 30, height: 50 },
        ],
        spawnPoints: [
            { x: 125, y: 375 },
            { x: 875, y: 375 },
            { x: 500, y: 125 },
            { x: 500, y: 625 }
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
    },

    killhouse: {
        name: "Killhouse",
        description: "Compact training facility with tight corridors",
        width: 800,
        height: 800,
        backgroundColor: "#2a2a1a",
        gridColor: "#3a3a2a",
        obstacles: [
            // Outer walls (thick wooden walls)
            { type: 'wall', x: 0, y: 0, width: 800, height: 25 },
            { type: 'wall', x: 0, y: 775, width: 800, height: 25 },
            { type: 'wall', x: 0, y: 0, width: 25, height: 800 },
            { type: 'wall', x: 775, y: 0, width: 25, height: 800 },

            // Central building (main structure)
            { type: 'wall', x: 300, y: 300, width: 200, height: 25 },   // North wall
            { type: 'wall', x: 300, y: 475, width: 200, height: 25 },   // South wall
            { type: 'wall', x: 300, y: 300, width: 25, height: 200 },   // West wall
            { type: 'wall', x: 475, y: 300, width: 25, height: 200 },   // East wall

            // Corner structures (NW)
            { type: 'wall', x: 75, y: 75, width: 100, height: 25 },
            { type: 'wall', x: 75, y: 75, width: 25, height: 100 },
            { type: 'wall', x: 150, y: 150, width: 25, height: 50 },

            // Corner structures (NE)
            { type: 'wall', x: 625, y: 75, width: 100, height: 25 },
            { type: 'wall', x: 700, y: 75, width: 25, height: 100 },
            { type: 'wall', x: 625, y: 150, width: 25, height: 50 },

            // Corner structures (SW)
            { type: 'wall', x: 75, y: 700, width: 100, height: 25 },
            { type: 'wall', x: 75, y: 625, width: 25, height: 100 },
            { type: 'wall', x: 150, y: 600, width: 25, height: 50 },

            // Corner structures (SE)
            { type: 'wall', x: 625, y: 700, width: 100, height: 25 },
            { type: 'wall', x: 700, y: 625, width: 25, height: 100 },
            { type: 'wall', x: 625, y: 600, width: 25, height: 50 },

            // Mid-lane barriers (North)
            { type: 'wall', x: 375, y: 125, width: 50, height: 100 },

            // Mid-lane barriers (South)
            { type: 'wall', x: 375, y: 575, width: 50, height: 100 },

            // Mid-lane barriers (West)
            { type: 'wall', x: 125, y: 375, width: 100, height: 50 },

            // Mid-lane barriers (East)
            { type: 'wall', x: 575, y: 375, width: 100, height: 50 },

            // Interior cover blocks
            { type: 'wall', x: 225, y: 225, width: 40, height: 40 },
            { type: 'wall', x: 535, y: 225, width: 40, height: 40 },
            { type: 'wall', x: 225, y: 535, width: 40, height: 40 },
            { type: 'wall', x: 535, y: 535, width: 40, height: 40 },

            // Diagonal cover near center
            { type: 'wall', x: 250, y: 365, width: 25, height: 70 },
            { type: 'wall', x: 525, y: 365, width: 25, height: 70 },
            { type: 'wall', x: 365, y: 250, width: 70, height: 25 },
            { type: 'wall', x: 365, y: 525, width: 70, height: 25 },
        ],
        spawnPoints: [
            { x: 100, y: 400 },     // West
            { x: 700, y: 400 },     // East
            { x: 400, y: 100 },     // North
            { x: 400, y: 700 },     // South
        ]
    }
};

// Export for Node.js (server) or make global for browser (client)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MAPS;
}
