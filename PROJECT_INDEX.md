# Darkweb Discord Bot — Complete Project

## 📁 Project File Structure

```
dcrp-darkweb/
│
├── 📄 Configuration Files
│   ├── package.json                 # Dependencies, scripts, metadata
│   ├── tsconfig.json                # TypeScript strict mode config
│   ├── .env.example                 # Environment template (COPY TO .env)
│   ├── .gitignore                   # Git exclusions
│   └── prisma/
│       └── schema.prisma            # Database schema with constraints
│
├── 📚 Documentation
│   ├── README.md                    # Full feature & usage documentation
│   ├── SETUP.md                     # Setup & deployment instructions
│   ├── IMPLEMENTATION.md            # Implementation summary & checklist
│   └── PROJECT_INDEX.md             # This file
│
├── 🤖 Bot Application (src/)
│   │
│   ├── index.ts                     # Main bot entry point
│   │                                  - Discord client initialization
│   │                                  - Interaction routing
│   │                                  - Error handling
│   │                                  - Graceful shutdown
│   │
│   ├── deploy-commands.ts           # Slash command deployment
│   │
│   ├── 🔧 config/
│   │   └── config.ts                # Centralized configuration
│   │                                  - Environment variable validation
│   │                                  - Discord, database, darkweb settings
│   │
│   ├── 🗄️ database/
│   │   └── client.ts                # Prisma client management
│   │                                  - Connection lifecycle
│   │                                  - Logging integration
│   │
│   ├── 🎯 services/
│   │   ├── registrationService.ts   # User registration logic
│   │   │                              - One-time registration per Discord account
│   │   │                              - Tag validation & uniqueness
│   │   │                              - Race condition handling
│   │   │
│   │   ├── messageService.ts        # Message creation & management
│   │   │                              - Content validation
│   │   │                              - Cooldown tracking
│   │   │                              - User status verification
│   │   │
│   │   ├── moderationService.ts     # Extensible moderation framework
│   │   │                              - Rule-based content filtering
│   │   │                              - Runtime rule registration
│   │   │
│   │   └── staffService.ts          # Staff commands & identity lookup
│   │                                  - Private lookups
│   │                                  - Revoke/ban/unban
│   │                                  - Registration reset
│   │
│   ├── 🎨 interactions/
│   │   ├── buttons/
│   │   │   ├── createTag.ts         # Registration button handler
│   │   │   └── newMessage.ts        # Message button handler
│   │   │
│   │   └── modals/
│   │       ├── createTag.ts         # Tag submission modal handler
│   │       └── newMessage.ts        # Message submission modal handler
│   │
│   ├── ⚙️ commands/
│   │   ├── staff.ts                 # Staff commands
│   │   │                              - /darkweb lookup
│   │   │                              - /darkweb revoke/ban/unban
│   │   │                              - /darkweb reset
│   │   │
│   │   └── setup.ts                 # Setup & verification
│   │                                  - /darkweb setup
│   │
│   ├── 🔤 types/
│   │   └── index.ts                 # TypeScript interfaces & constants
│   │                                  - DarkwebUserData, MessageResult, etc.
│   │                                  - Custom IDs for persistent interactions
│   │
│   └── 🛠️ utils/
│       ├── validation.ts            # Input validation
│       │                              - Tag format (4 digits)
│       │                              - Message content length
│       │                              - Mention sanitization
│       │
│       ├── formatting.ts            # Discord message formatting
│       │                              - Darkweb message display
│       │                              - Timestamp formatting
│       │                              - Tag formatting (Anon #XXXX)
│       │
│       ├── logger.ts                # Structured logging
│       │                              - JSON-compatible logging
│       │                              - Sensitive data filtering
│       │
│       └── panels.ts                # Panel generation
│                                      - Registration panel
│                                      - Messaging panel
│
├── 🧪 tests/
│   └── services.test.ts             # Integration tests
│                                      - Registration logic
│                                      - Message validation
│                                      - Cooldown enforcement
│                                      - Race condition handling
│
├── 🚀 Setup & Deployment
│   ├── setup.bat                    # Windows setup automation
│   └── setup.sh                     # Unix/Linux/macOS setup automation
│
└── 📦 Build Output (auto-generated)
    └── dist/                        # Compiled JavaScript
                                      - Created by: npm run build
                                      - Used by: npm start
```

---

## 📊 File Statistics

- **Total TypeScript Files:** 18
- **Total Lines of Code:** ~3,500 (excluding tests)
- **Services:** 4 (registration, messaging, moderation, staff)
- **Interaction Handlers:** 4 (2 buttons, 2 modals)
- **Slash Commands:** 2 command groups (staff, setup)
- **Database Models:** 3 (DarkwebUser, DarkwebMessage, BotConfig)
- **Test Suites:** 1 (with 10+ test cases)

---

## 🚀 Quick Reference

### Development Workflow

```bash
# Initial setup
npm install                 # Install dependencies
npm run db:generate        # Generate Prisma client
npm run db:push            # Create database schema
npm run deploy-commands    # Register slash commands

# Development
npm run dev                # Live development mode with tsx

# Testing
npm test                   # Run tests
npm run test:watch        # Watch mode for tests

# Build & Deploy
npm run build              # Compile TypeScript to dist/
npm start                  # Run production build
```

### Environment Setup

```bash
# Copy template
cp .env.example .env

# Edit .env with:
DISCORD_TOKEN=             # Bot token
DISCORD_CLIENT_ID=         # Application ID
DISCORD_GUILD_ID=          # Server ID
DATABASE_URL=              # PostgreSQL connection
DARKWEB_REGISTRATION_CHANNEL_ID=   # Channel ID
DARKWEB_MESSAGE_CHANNEL_ID=        # Channel ID
DARKWEB_STAFF_ROLE_ID=    # Optional staff role
```

---

## 🔑 Key Features

### ✅ Registration
- One registration per Discord account
- 4-digit numeric tags (0000–9999)
- Leading zeros preserved
- Unique tag enforcement at database level
- Race condition protection

### ✅ Messaging
- Anonymous posting as `Anon #XXXX`
- Automatic identity resolution
- No manual tag re-entry
- Cooldown anti-spam (10 seconds default)
- Message length validation
- Content sanitization

### ✅ User Management
- Status tracking (ACTIVE, REVOKED, BANNED)
- User status enforcement on messages
- Message count tracking per identity

### ✅ Staff Tools
- Private identity lookups
- User revocation and banning
- Ban restoration
- Registration reset
- Role-based permissions

### ✅ Security
- No secrets in code
- Environment variable configuration
- Database unique constraints
- Private/ephemeral responses
- Input validation
- Parameterized queries (Prisma)
- Structured logging

---

## 📋 Database Schema

### `darkweb_users`
```
id              UUID (primary key)
discord_id      STRING (unique) — Discord user ID
darkweb_tag     VARCHAR(4) (unique) — Anonymous tag (0000–9999)
status          ENUM (ACTIVE, REVOKED, BANNED)
created_at      DATETIME
updated_at      DATETIME
```

### `darkweb_messages`
```
id              UUID (primary key)
discord_user_id STRING — Links to discord_id
darkweb_tag     VARCHAR(4) — Anonymous tag
content         STRING — Message text
discord_message_id STRING — Discord message ID (for tracking)
deleted         BOOLEAN — Soft-delete flag
created_at      DATETIME
edited_at       DATETIME
```

### `bot_config`
```
key             STRING (primary key)
value           STRING — Configuration value
```

---

## 🎯 User Workflows

### Registration Flow
```
User → #darkweb-registration
        ↓
     Click "Create Tag" button
        ↓
     Enter tag (e.g., 3699)
        ↓
     Validation:
     • Discord account not registered?
     • Tag available?
        ↓
     ✅ Create: Anon #3699
```

### Messaging Flow
```
User → #darkweb-msg
       ↓
    Click "New Message" button
       ↓
    Check: User registered?
       ↓
    Modal: Enter message
       ↓
    Validation:
    • Not empty?
    • Not too long?
    • User active?
    • Cooldown passed?
       ↓
    ✅ Bot posts: Anon #3699's message
```

### Staff Lookup Flow
```
Staff → /darkweb lookup 3699
         ↓
      Permission check (role)
         ↓
      Private response:
      • Tag: 3699
      • Discord ID: 123456789
      • Status: Active
      • Messages: 42
```

---

## 🧠 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Discord Server                         │
│  ┌──────────────────┬──────────────────────────┐ │
│  │ #darkweb-regis   │ #darkweb-msg            │ │
│  │ [Create Tag]     │ [New Message]           │ │
│  └────────┬─────────┴──────────┬──────────────┘ │
└───────────┼──────────────────────┼────────────────┘
            │                      │
            ▼                      ▼
      ┌──────────────────────────────────┐
      │    discord.js Bot (src/index.ts) │
      └──────┬─────────────────┬─────────┘
             │                 │
             ▼                 ▼
      Buttons/Modals      Slash Commands
      (interactions/)      (commands/)
             │                 │
             └────────┬────────┘
                      ▼
         ┌────────────────────────┐
         │   Services Layer       │
         │ ┌────────────────────┐ │
         │ │ registrationSvc    │ │
         │ │ messageSvc         │ │
         │ │ moderationSvc      │ │
         │ │ staffSvc           │ │
         │ └────────────────────┘ │
         └────────────┬───────────┘
                      │
         ┌────────────▼───────────┐
         │   Prisma ORM           │
         │   (src/database/)      │
         └────────────┬───────────┘
                      │
         ┌────────────▼───────────┐
         │  PostgreSQL Database   │
         │  (darkweb_users,       │
         │   darkweb_messages)    │
         └────────────────────────┘
```

---

## 📦 NPM Scripts

```json
{
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "tsx watch src/index.ts",
  "deploy-commands": "tsx src/deploy-commands.ts",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:migrate:prod": "prisma migrate deploy",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "tsc --noEmit"
}
```

---

## 🔒 Security Checklist

- ✅ No hardcoded tokens or passwords
- ✅ Environment variables for all credentials
- ✅ Database unique constraints prevent duplicates
- ✅ Input validation on all user inputs
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ Discord ID never exposed in public messages
- ✅ Ephemeral responses for sensitive data
- ✅ Staff role verification on commands
- ✅ Logging without exposing secrets
- ✅ Graceful error handling

---

## 🧪 Testing

Tests cover:
- Tag validation (format, leading zeros, invalid)
- Registration (new users, duplicates, race conditions)
- Messaging (validation, cooldown, status)
- User lookups and staff actions

Run tests:
```bash
npm test              # Once
npm run test:watch    # Watch mode
```

---

## 📈 Scalability & Future Work

### V1 (Current) ✅
- Discord anonymous messaging
- Basic registration & messaging
- Staff tools
- User status management

### V2 Roadmap
- [ ] FiveM integration (shared backend)
- [ ] API endpoints for external access
- [ ] Message reactions
- [ ] Private Darkweb DMs
- [ ] Advanced moderation (AI filtering)
- [ ] Reputation system
- [ ] Marketplace

### Architecture Benefits
- **Service layer is standalone** — Can add API without changing core logic
- **Database is normalized** — Ready for scaling
- **Moderation extensible** — Add rules without refactoring
- **No hardcoded Discord logic in services** — Easy to add other clients (API, FiveM, etc.)

---

## 🚀 Deployment

### Local Testing
```bash
npm run dev
```

### Production (Node/Docker)
```bash
npm run build
npm start
```

### Environment Variables (Production)
Set in your hosting platform:
- All `DISCORD_*` variables
- `DATABASE_URL` (production database)
- All `DARKWEB_*` variables

---

## 📞 Support & Troubleshooting

See `SETUP.md` for detailed troubleshooting.

Common issues:
1. **"Token missing"** → Set `DISCORD_TOKEN` in `.env`
2. **"Cannot connect to database"** → Check `DATABASE_URL` and PostgreSQL
3. **"No permission to send"** → Verify bot role permissions
4. **"Channels not found"** → Use right-click "Copy Channel ID"

---

## 📄 License & Attribution

Part of the DCRP ecosystem.

**Built with:**
- discord.js 14
- Prisma ORM
- PostgreSQL
- TypeScript

---

**Status: Production Ready** ✅  
**Last Updated:** September 2, 2026  
**Version:** 1.0.0

