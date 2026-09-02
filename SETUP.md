# Setup Instructions

## Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- PostgreSQL 12+
- Discord bot token
- Discord server

### 1. Clone or Extract Project

```bash
cd D:/DCRP-Bots/DCRP-Darkweb
```

### 2. Run Setup Script

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Configure Environment

Edit `.env` with your credentials:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_app_id_here
DISCORD_GUILD_ID=your_server_id_here
DATABASE_URL=postgresql://user:pass@localhost:5432/darkweb?schema=public
DARKWEB_REGISTRATION_CHANNEL_ID=channel_id
DARKWEB_MESSAGE_CHANNEL_ID=channel_id
DARKWEB_STAFF_ROLE_ID=role_id (optional)
```

### 4. Initialize Database

```bash
npm run db:push
npm run deploy-commands
```

### 5. Start Bot

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## Manual Setup (If Script Fails)

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Setup database
npm run db:push

# Deploy slash commands
npm run deploy-commands

# Run
npm run dev
```

## Discord Bot Configuration

### Create Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name: "Darkweb Bot"
4. Go to "Bot" → "Add Bot"
5. Copy TOKEN to `.env` as `DISCORD_TOKEN`
6. Under "Settings" → "OAuth2" → "General", copy Client ID as `DISCORD_CLIENT_ID`

### Set Permissions

Under "OAuth2" → "URL Generator":
- Scopes: `bot`
- Permissions:
  - Send Messages
  - Embed Links
  - Manage Messages
  - Read Message History

Generate and open the URL to invite bot to server.

### Create Channels

In your Discord server:

1. Create `#darkweb-registration` (channel permissions: users cannot send messages)
2. Create `#darkweb-msg` (channel permissions: users cannot send messages)

Right-click each channel → "Copy Channel ID" and add to `.env`.

### Create Staff Role (Optional)

1. Create role "Darkweb Staff" or similar
2. Right-click → "Copy Role ID"
3. Add to `.env` as `DARKWEB_STAFF_ROLE_ID`

## Database Setup

### PostgreSQL Local Setup

**macOS with Homebrew:**
```bash
brew install postgresql
brew services start postgresql
createdb darkweb
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

**Linux (Ubuntu/Debian):**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
createdb darkweb
```

### Connection String

```
postgresql://username:password@localhost:5432/darkweb?schema=public
```

Replace `username` and `password` with your PostgreSQL credentials.

### Docker PostgreSQL

```bash
docker run --name darkweb-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=darkweb \
  -p 5432:5432 \
  -d postgres:16

# Connection string:
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/darkweb?schema=public
```

## Verification

After setup:

1. Check bot is online in Discord
2. Run `/darkweb setup` in any channel (staff only)
3. Visit `#darkweb-registration` — should see panel with button
4. Visit `#darkweb-msg` — should see panel with button
5. Test registration: click button, enter tag (0001), should succeed

## Troubleshooting

### "DISCORD_TOKEN is missing"

- Set `DISCORD_TOKEN` in `.env`
- Ensure `.env` is in the project root
- Restart bot after editing `.env`

### "Cannot connect to database"

- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `createdb darkweb`
- Test connection: `psql postgresql://user:pass@localhost:5432/darkweb`

### "Bot has no permission to send messages"

- Check bot permissions in Discord server
- Run `/darkweb setup` to verify
- Manually check bot role has "Send Messages" permission

### "Channels not found"

- Verify channel IDs in `.env` are correct
- Use right-click → "Copy Channel ID" (not name)
- Channels must be text channels, not categories

### "Slash commands not showing"

- Run `npm run deploy-commands`
- Wait 1 minute for Discord to sync
- If still missing, check `DISCORD_CLIENT_ID` is correct

## Running Tests

```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

Tests require a test database. Set in environment:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/darkweb_test?schema=public npm test
```

## Production Deployment

### Build

```bash
npm run build
```

Output in `dist/` directory.

### Environment Variables

Set these in production:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DATABASE_URL` (production database)
- `DARKWEB_REGISTRATION_CHANNEL_ID`
- `DARKWEB_MESSAGE_CHANNEL_ID`
- `DARKWEB_STAFF_ROLE_ID` (optional)
- `DARKWEB_MESSAGE_COOLDOWN_SECONDS` (default: 10)
- `DARKWEB_MESSAGE_MAX_LENGTH` (default: 1000)

### Docker

```bash
docker build -t darkweb-bot .
docker run -d \
  -e DISCORD_TOKEN=... \
  -e DATABASE_URL=... \
  --name darkweb-bot \
  darkweb-bot
```

### Systemd Service (Linux)

Create `/etc/systemd/system/darkweb-bot.service`:

```ini
[Unit]
Description=Darkweb Bot
After=network.target

[Service]
Type=simple
User=darkweb
WorkingDirectory=/opt/darkweb-bot
Environment="DISCORD_TOKEN=..."
Environment="DATABASE_URL=..."
ExecStart=/usr/bin/node /opt/darkweb-bot/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable darkweb-bot
sudo systemctl start darkweb-bot
```

## Support

Check logs:
```bash
npm run dev
```

All errors logged to console with timestamps and details.

For specific issues, check:
1. `DISCORD_TOKEN` is valid
2. `DATABASE_URL` is correct and database is running
3. Bot has required Discord permissions
4. Channels are configured and accessible
5. Environment variables are set

---

See README.md for full documentation.
