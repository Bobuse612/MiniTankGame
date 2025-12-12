# Tank Battle 2D - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Browser 1  │  │  Browser 2  │  │  Browser N  │              │
│  │  (game.js)  │  │  (game.js)  │  │  (game.js)  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    WebSocket (Socket.io)                         │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     SERVER (Node.js)                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │   Room 1    │  │   Room 2    │  │   Room N    │        │  │
│  │  │  - players  │  │  - players  │  │  - players  │        │  │
│  │  │  - bullets  │  │  - bullets  │  │  - bullets  │        │  │
│  │  │  - map      │  │  - map      │  │  - map      │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              GAME LOOP (60 FPS)                      │  │  │
│  │  │  - Update bullet positions                           │  │  │
│  │  │  - Check collisions (bullets vs walls/players)       │  │  │
│  │  │  - Handle damage and respawns                        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          SERVER                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Server as Authority
The server is the **single source of truth** for the game state. This prevents cheating and ensures all players see the same game.

### 2. Client-Side Prediction
Clients predict their own movement locally for smooth gameplay, but the server validates all positions.

### 3. Room-Based Multiplayer
Players are grouped into isolated rooms. Each room has its own game state (players, bullets, map).

### 4. Real-Time Communication
Socket.io provides bidirectional WebSocket communication for instant updates.
