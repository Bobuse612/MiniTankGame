# Tank Battle 2D - Project Memory

## Project Overview
A browser-based multiplayer 2D tank battle game with top-down perspective. Players control tanks and battle against each other in real-time using WebSockets.

## Tech Stack
- **Server**: Node.js + Express + Socket.io
- **Client**: HTML5 Canvas + Vanilla JavaScript
- **Real-time**: WebSockets via Socket.io

## Project Structure
```
/server.js         - Game server (Express + Socket.io)
/public/           - Static client files
  /index.html      - Game page with UI
  /game.js         - Client-side game logic
/package.json      - Dependencies
```

## Common Commands
```bash
npm install        # Install dependencies
npm start          # Start the server (port 3000)
```

## Game Architecture

### Server (server.js)
- Manages game state (players, bullets)
- Handles player connections/disconnections
- Processes movement and shooting events
- Runs collision detection at 60 FPS
- Broadcasts state updates to all clients

### Client (public/game.js)
- Renders game using HTML5 Canvas
- Handles keyboard/mouse input
- Sends player actions via Socket.io
- Updates UI (health, score, scoreboard)

## Socket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `init` | Server→Client | Initial game state |
| `move` | Client→Server | Player movement |
| `shoot` | Client→Server | Fire bullet |
| `playerJoined` | Server→Clients | New player connected |
| `playerLeft` | Server→Clients | Player disconnected |
| `bulletFired` | Server→Clients | New bullet created |
| `playerHit` | Server→Clients | Player took damage |

## Game Constants
- Tank size: 30px
- Bullet speed: 10px/frame
- Move speed: 4px/frame
- Damage per hit: 25 HP
- Starting health: 100 HP
- Shoot cooldown: 300ms
