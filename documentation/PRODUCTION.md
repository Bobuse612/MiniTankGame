# Production Deployment Guide

## Why Only One Server?

Currently, the game runs as a **single Node.js process**:
- Simple to develop and test
- All game state in memory
- Works fine for small scale (< 100 players)

### Limitations of Single Server
- Single point of failure (server crashes = game down)
- Limited to one machine's resources
- Can't scale horizontally

## Production Setup Options

### Option 1: Single Server with PM2 (Simple)

Best for: Small to medium traffic, single VPS/server

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "tank-battle"

# Auto-restart on crash
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs tank-battle
```

**PM2 ecosystem file** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'tank-battle',
    script: 'server.js',
    instances: 1,           // Keep at 1 for Socket.io
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Option 2: With Nginx Reverse Proxy (Recommended)

```
Internet → Nginx (port 80/443) → Node.js (port 3000)
```

**Nginx config** (`/etc/nginx/sites-available/tank-battle`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support (required for Socket.io)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for WebSocket
        proxy_read_timeout 86400;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/tank-battle /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Docker Deployment

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  tank-battle:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

## Environment Variables

Update `server.js` to use environment variables:

```javascript
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

Create `.env` file (don't commit to git):
```
PORT=3000
NODE_ENV=production
```

## Scaling Socket.io (Multiple Servers)

### The Problem
Socket.io keeps connections in memory. With multiple servers:
- Player A connects to Server 1
- Player B connects to Server 2
- They can't see each other!

### Solution: Redis Adapter

```bash
npm install @socket.io/redis-adapter redis
```

Update `server.js`:
```javascript
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});
```

### Architecture with Redis

```
                    ┌─────────────┐
                    │   Nginx     │
                    │ (Load Bal.) │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  Server 1   │  │  Server 2   │  │  Server 3   │
   │  (Node.js)  │  │  (Node.js)  │  │  (Node.js)  │
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │  (Pub/Sub)  │
                    └─────────────┘
```

**Important**: Need sticky sessions so clients always hit same server:

Nginx sticky sessions:
```nginx
upstream tank_servers {
    ip_hash;  # Sticky sessions based on IP
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    location / {
        proxy_pass http://tank_servers;
        # ... websocket headers ...
    }
}
```

## Cloud Deployment Options

### Heroku
```bash
# Procfile
web: node server.js

# Deploy
heroku create tank-battle-game
git push heroku main
```

### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: tank-battle
services:
  - name: web
    github:
      repo: yourusername/tank-battle
      branch: main
    run_command: node server.js
    http_port: 3000
```

### AWS EC2 / Lightsail
1. Launch Ubuntu instance
2. Install Node.js, Nginx, PM2
3. Clone repo
4. Setup as described above

### Railway / Render / Fly.io
Most support Node.js with simple config:
```bash
# Just push to connected repo
# Set PORT environment variable
# They handle the rest
```

## SSL/HTTPS (Required for Production)

### With Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Socket.io with HTTPS
No code changes needed - Nginx handles SSL termination.

## Production Checklist

- [ ] Use environment variables (not hardcoded values)
- [ ] Set `NODE_ENV=production`
- [ ] Use PM2 or similar process manager
- [ ] Setup Nginx reverse proxy
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (only expose 80/443)
- [ ] Setup logging (PM2 logs or external service)
- [ ] Monitor server resources
- [ ] Setup automatic backups (if using database)
- [ ] Rate limiting (prevent abuse)
- [ ] Error tracking (Sentry, etc.)

## Quick Start Commands

```bash
# Development
npm start

# Production (single server)
NODE_ENV=production PORT=3000 pm2 start server.js --name tank-battle

# With Docker
docker-compose up -d

# View logs
pm2 logs tank-battle
docker-compose logs -f
```
