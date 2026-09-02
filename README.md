# Darkweb Discord Bot — V1

A production-ready Discord bot providing anonymous Darkweb-style messaging inside a Discord server.

## Features

- **One-time Registration**: Users register once with a unique 4-digit numeric tag (0000–9999)
- **Anonymous Messaging**: Post messages publicly as `Anon #XXXX` without revealing Discord identity
- **Automatic Identity Resolution**: Bot automatically identifies users when they send messages
- **Staff Tools**: Lookup, revoke, ban, and reset user identities
- **Database Persistence**: PostgreSQL backend with Prisma ORM
- **Race Condition Protection**: Database unique constraints prevent tag collision
- **Cooldown System**: Configurable anti-spam message delays
- **User Status Management**: Active, revoked, and banned states
- **Structured Logging**: All operations logged for audit trails
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Tech Stack

- **Runtime**: Node.js ≥18.0.0
- **Language**: TypeScript
- **Bot Framework**: discord.js v14
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Vitest

## Project Structure

```
darkweb-bot/
├── src/
│   ├── index.ts                 # Bot entry point
│   ├── deploy-commands.ts       # Command deployment
│   ├── config/
│   │   └── config.ts           # Configuration management
│   ├── database/
│   │   └── client.ts           # Prisma client
│   ├── services/
│   │   ├── registrationService.ts
│   │   ├── messageService.ts
│   │   ├── moderationService.ts
│   │   └── staffService.ts
│   ├── interactions/
│   │   ├── buttons/
│   │   │   ├── createTag.ts
│   │   │   └── newMessage.ts
│   │   └── modals/
│   │       ├── createTag.ts
│   │       └── newMessage.ts
│   ├── commands/
│   │   ├── staff.ts            # Staff lookup/revoke/ban
│   │   └── setup.ts            # Server setup verification
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── utils/
│       ├── config.ts           # (moved to src/config/)
│       ├── validation.ts       # Input validation
│       ├── formatting.ts       # Discord message formatting
│       └── logger.ts           # Structured logging
├── prisma/
│   └── schema.prisma           # Database schema
├── tests/
│   └── services.test.ts        # Integration tests
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Discord Setup

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Darkweb Bot"
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the **TOKEN** (you'll need it for `.env`)
7. Under TOKEN section, click "Reset Token" if needed and copy it

### 2. Set Bot Permissions

Under "OAuth2" → "URL Generator":

- Scopes: `bot`
- Permissions:
  - Send Messages
  - Embed Links
  - Manage Messages
  - Read Message History

Copy the generated URL and open it to invite the bot to your server.

### 3. Create Discord Channels

In your server, create:

1. **#darkweb-registration** — Registration channel (users cannot send messages)
2. **#darkweb-msg** — Message channel (users cannot send messages)

Note the channel IDs (right-click → "Copy Channel ID").

### 4. Create Staff Role (Optional)

Create a role for staff (e.g., "Darkweb Staff" or "Moderators") and note the role ID.

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
# Discord
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_app_id_here
DISCORD_GUILD_ID=your_server_id_here

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/darkweb?schema=public

# Channels (get IDs by right-clicking in Discord)
DARKWEB_REGISTRATION_CHANNEL_ID=channel_id_here
DARKWEB_MESSAGE_CHANNEL_ID=channel_id_here

# Staff (optional)
DARKWEB_STAFF_ROLE_ID=role_id_here

# Settings
DARKWEB_MESSAGE_COOLDOWN_SECONDS=10
DARKWEB_MESSAGE_MAX_LENGTH=1000
```

**⚠️ IMPORTANT**: Never commit `.env` to version control.

### 3. Database Setup

#### Using Local PostgreSQL

```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE darkweb;"

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/darkweb?schema=public
```

#### Using Docker

```bash
docker run --name darkweb-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=darkweb \
  -p 5432:5432 \
  -d postgres:16
```

### 4. Run Migrations

```bash
npm run db:generate
npm run db:push
```

This creates the database tables defined in `prisma/schema.prisma`.

### 5. Deploy Slash Commands

```bash
npm run deploy-commands
```

This registers the `/darkweb` command with Discord.

## Running the Bot

### Development

```bash
npm run dev
```

Uses `tsx` for live TypeScript reloading.

### Production

```bash
npm run build
npm start
```

## Usage

### User Workflow

#### Registration (First Time)

1. User enters `#darkweb-registration`
2. User clicks **📝 Create Tag** button
3. User enters a 4-digit numeric tag (e.g., `3699`)
4. Bot validates:
   - Is the Discord account already registered?
   - Is the tag available?
5. If valid, bot replies: `✅ Darkweb Registration Successful — Anon #3699`

#### Sending a Message (Every Time)

1. User enters `#darkweb-msg`
2. User clicks **📝 New Message** button
3. Bot checks: Is the user registered?
4. Modal opens
5. User enters message content
6. User clicks "Submit"
7. Bot validates:
   - Is the message empty or too long?
   - Is the user active (not revoked/banned)?
   - Has the cooldown period elapsed?
8. If valid, bot posts message to `#darkweb-msg`:

```
🕸️ DARKWEB

Anon #3699
Selling SP-45. Contact me.

09/02/2026 04:16 AM
```

9. Bot replies to user: `✅ Message Sent`

### Staff Commands

All staff commands require the configured `DARKWEB_STAFF_ROLE_ID` role.

#### Lookup Identity

```bash
/darkweb lookup <tag>
/darkweb lookup 3699
```

Private response with Discord ID, status, and message count.

#### Lookup by Discord User

```bash
/darkweb lookup @User
```

#### Revoke Identity

```bash
/darkweb revoke 3699
```

User can no longer send messages.

#### Ban Identity

```bash
/darkweb ban 3699
```

User completely banned from Darkweb.

#### Restore Identity

```bash
/darkweb unban 3699
```

Restore a revoked or banned identity.

#### Reset User Registration

```bash
/darkweb reset @User
```

Delete the user's registration. They can register again with a new tag.

#### Verify Setup

```bash
/darkweb setup
```

Verify bot permissions and channel configuration.

## Database Schema

### `darkweb_users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `discord_id` | String | Unique, Not Null |
| `darkweb_tag` | String(4) | Unique, Not Null |
| `status` | Enum | ACTIVE, REVOKED, BANNED |
| `created_at` | DateTime | Default: now() |
| `updated_at` | DateTime | Auto-updated |

### `darkweb_messages`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `discord_user_id` | String | Not Null |
| `darkweb_tag` | String(4) | Not Null |
| `content` | String | Not Null |
| `discord_message_id` | String | Nullable |
| `deleted` | Boolean | Default: false |
| `created_at` | DateTime | Default: now() |
| `edited_at` | DateTime | Nullable |

## Testing

Run tests with:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

### Test Coverage

Tests verify:

- **Tag validation**: Format, leading zeros, invalid inputs
- **Registration**: New users, duplicates, race conditions
- **Messaging**: Content validation, cooldown, user status
- **Staff actions**: Lookup, revoke, ban

## Deployment

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t darkweb-bot .
docker run -d --name darkweb-bot -e DATABASE_URL=... -e DISCORD_TOKEN=... darkweb-bot
```

### Heroku / Railway / Render

1. Push to GitHub
2. Connect repository to hosting platform
3. Set environment variables in platform dashboard
4. Deploy

## Security

- ✅ No secrets in source code
- ✅ Environment variables for sensitive data
- ✅ Database unique constraints prevent race conditions
- ✅ Staff commands require role verification
- ✅ Private/ephemeral responses for sensitive info
- ✅ Discord identity never exposed publicly
- ✅ Input validation and sanitization
- ✅ Parameterized queries via Prisma

## Logging

The bot logs all significant events:

- Bot startup/shutdown
- Database connections
- Registration attempts (success/failure)
- Message publication
- Staff actions
- Errors (without exposing secrets)

View logs in the console. For production, consider piping to a log file or service.

## Future Enhancements

### V2+ Roadmap

- [ ] FiveM integration (API endpoint for FiveM server to query messages)
- [ ] Message reactions
- [ ] Private Darkweb DMs
- [ ] Message search
- [ ] Reputation system
- [ ] Darknet marketplace
- [ ] Admin dashboard
- [ ] Advanced moderation (keyword filtering, spam detection)

## Support

For issues or questions:

1. Check logs: `npm run dev` and watch the console output
2. Verify environment variables are set
3. Verify database connection
4. Verify bot has required Discord permissions
5. Verify Discord channels are configured correctly

## License

This project is part of the DCRP ecosystem.

## Contributing

Follow these guidelines:

- Use TypeScript strict mode
- Add tests for new features
- Run `npm run lint` before committing
- Keep services modular and testable
- Document complex logic with comments

---

**Built with ❤️ for the DCRP community**
