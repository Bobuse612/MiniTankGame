# Tank Battle 2D

A multiplayer 2D tank battle game with top-down view, playable in the browser.

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Start server
npm start

# Open browser
http://localhost:3000
```

## Production Deployment

### Option 1: PM2 (Recommended for VPS)

```bash
# Install PM2
npm install -g pm2

# Start in production
npm run pm2:start

# Other commands
npm run pm2:stop     # Stop server
npm run pm2:restart  # Restart server
npm run pm2:logs     # View logs
```

### Option 2: Docker

```bash
# Build and run
npm run docker:up

# Stop
npm run docker:down
```

### Option 3: Manual

```bash
NODE_ENV=production PORT=3000 node server.js
```

### With Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Game Features

- **Multiplayer**: Up to 4 players per room
- **Bots**: Add AI opponents when creating a game
- **Maps**: Multiple maps with different sizes and obstacles
- **Obstacles**: Walls (block everything) and Water (block players only)

## Controls

| Key | Action |
|-----|--------|
| Z/Q/S/D (AZERTY) | Move |
| W/A/S/D (QWERTY) | Move |
| Arrow Keys | Shoot (8 directions) |

## Available Maps

| Map | Size | Description |
|-----|------|-------------|
| Warehouse | 800x600 | Tight corridors and corners |
| Island | 800x600 | Water borders with central arena |
| Battlefield | 1200x800 | Large open map with scattered cover |

## Project Structure

```
MiniTankGame/
├── server.js              # Game server
├── package.json           # Dependencies
├── ecosystem.config.js    # PM2 config
├── Dockerfile             # Docker build
├── docker-compose.yml     # Docker orchestration
├── public/
│   ├── index.html         # Lobby page
│   ├── game.html          # Game page
│   ├── game.js            # Client game logic
│   ├── config.js          # Shared configuration
│   └── maps.js            # Map definitions
└── documentation/         # Technical docs
```

## Configuration

Edit `public/config.js` to adjust:
- Tank speed and physics
- Bullet speed and damage
- Health and respawn settings

Edit `public/maps.js` to:
- Modify existing maps
- Add new maps with custom dimensions
- Configure obstacles and spawn points

## Documentation

See `/documentation` folder for:
- Architecture overview
- Server/Client implementation
- Multiplayer networking flow
- Production deployment guide
