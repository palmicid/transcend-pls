# Game Lobby Development Guide

This document provides instructions to set up and run the game lobby application for development and testing.

## Project Structure

```text
server/
├── lib/                          # Shared utilities and core modules
│   ├── auth.ts                   # Authentication helpers (cookies, sessions)
│   ├── db.ts                     # Database connection (Prisma)
│   ├── broadcast/                # Real-time messaging
│   │   ├── Broadcaster.ts        # Abstract broadcaster interface
│   │   ├── InMemoryBroadcaster.ts # Simple in-memory implementation
│   │   └── index.ts              # Barrel exports
│   ├── game/                     # Game framework
│   │   ├── Game.ts               # Abstract game class
│   │   ├── GameConfig.ts         # Game configuration interface
│   │   ├── GameState.ts          # Game state interface
│   │   ├── PlayerSlot.ts         # Player slot interface
│   │   └── index.ts              # Barrel exports
│   ├── rooms/                    # Room management
│   │   ├── Room.ts               # Individual room instance
│   │   ├── RoomManager.ts        # Room orchestration singleton
│   │   ├── RoomState.ts          # Room lifecycle state machine
│   │   └── index.ts              # Barrel exports
│   └── sse/                      # Server-Sent Events utilities
│       ├── createSSEHandler.ts   # Reusable SSE handler factory
│       └── index.ts              # Barrel exports
├── app/
│   ├── api/
│   │   └── health/               # Health check endpoint
│   ├── auth/
│   │   ├── actions.ts            # Login/logout server actions
│   │   └── login/                # Login page
│   ├── game/
│   │   └── tic-tac-toe/          # Tic-Tac-Toe game implementation
│   │       ├── TicTacToeGame.ts      # Game logic
│   │       ├── TicTacToeConfig.ts    # Game configuration
│   │       ├── TicTacToeState.ts     # Game state
│   │       ├── TicTacToePlayerSlot.ts # Player management
│   │       ├── actions.ts            # Server actions
│   │       └── [roomId]/subscribe/   # WebSocket endpoint
│   └── lobby/                    # Main lobby (public entry point)
│       ├── page.tsx              # Lobby page
│       ├── LobbyContent.tsx      # Lobby UI component
│       ├── actions.ts            # Server actions
│       └── [roomId]/
│           ├── page.tsx          # Room page
│           ├── RoomView.tsx      # Room UI component
│           └── subscribe/        # WebSocket endpoint
├── prisma/
│   └── schema.prisma             # Database schema
├── .env.local                    # Local environment (git-ignored)
└── package.json
```

## Import Conventions

Use barrel exports for clean imports:

```typescript
// Room management
import { roomManager, Room, State } from "@/lib/rooms";

// Broadcasting
import { broadcaster, Broadcaster } from "@/lib/broadcast";

// Game framework
import { Game, GameConfig, GameState, PlayerSlot } from "@/lib/game";

// SSE utilities
import { createSSEHandler } from "@/lib/sse";

// Authentication
import { getSession, requireAuth } from "@/lib/auth";
```

## Prerequisites

- **Node.js** 18+ (with npm/yarn)
- **PostgreSQL** 13+ (running locally or remote)
- **Git** (for version control)

## Setup Steps

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/transcendence"
NODE_ENV="development"
```

### 3. Setup Prisma

Generate Prisma client:

```bash
npx prisma generate
```

Run migrations (if any exist):

```bash
npx prisma migrate deploy
```

Or create the database schema from scratch:

```bash
npx prisma db push
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at: **<http://localhost:3000>**

## Architecture

### Core Modules (in `lib/`)

1. **rooms/** - Room Management
   - `RoomState.ts` - Finite state machine (OPEN → READY → IN_GAME → ENDED)
   - `Room.ts` - Individual room with game instance
   - `RoomManager.ts` - Singleton managing all rooms

2. **broadcast/** - Real-time Communication
   - `Broadcaster.ts` - Abstract pub/sub interface
   - `InMemoryBroadcaster.ts` - Development implementation

3. **game/** - Game Framework
   - `Game.ts` - Abstract base class for all games
   - `GameConfig.ts`, `GameState.ts`, `PlayerSlot.ts` - Supporting interfaces

4. **sse/** - Server-Sent Events Utilities
   - `createSSEHandler.ts` - Factory for SSE streaming routes

### Adding a New Game

1. Create folder: `app/play/[game-name]/`
2. Implement:
   - `[GameName]Config.ts` - implements `GameConfig`
   - `[GameName]State.ts` - implements `GameState`
   - `[GameName]PlayerSlot.ts` - implements `PlayerSlot`
   - `[GameName]Game.ts` - extends `Game`
   - `actions.ts` - server actions
   - `[roomId]/subscribe/route.ts` - SSE endpoint

3. Use `createSSEHandler` for the route:

```typescript
import { createSSEHandler } from "@/lib/sse";
import { roomManager } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";

export async function GET(req, { params }) {
  const { roomId } = await params;
  const userId = new URL(req.url).searchParams.get("userId");

  roomManager.ensureRoom(roomId, broadcaster);
  roomManager.addPlayer(roomId, userId);

  return createSSEHandler({
    onInit: (send) => {
      send({ event: "init", data: { roomId, snapshot: roomManager.getSnapshot(roomId) } });
    },
    onSubscribe: (send) => {
      const listener = (data) => send({ event: "snapshot", data: JSON.parse(data) });
      broadcaster.addListener(roomId, listener);
      return () => broadcaster.removeListener(roomId, listener);
    },
    onCleanup: () => { roomManager.removePlayer(roomId, userId); },
  });
}
```

## Testing

### Automated Tests

Run the test suite with Vitest:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

Test files are located in `__tests__/`:

- `game/` - Game logic unit tests
- `rooms/` - Room state machine tests
- `actions/` - Server action integration tests
- `api/` - API endpoint tests

### Manual Testing

#### Single Player Testing

1. Open `http://localhost:3000/lobby`
2. Create room with ID `TEST1`, Type `Tic-Tac-Toe`
3. Join as any player name
4. Click Start Game

### Multiplayer Testing

1. **Tab 1:** Create room `GAME1` as Tic-Tac-Toe, join as `player1`
2. **Tab 2:** Join same room as `player2`
3. **Tab 1:** Click "Start Game"
4. Both tabs should see live updates

## Build for Production

```bash
npm run build
npm start
```

---

Happy gaming! 🎮
