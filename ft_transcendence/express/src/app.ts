import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { RoomManager, Client, RoomType } from './lib';
import { config } from './config';

const app = express();

// =============================================================================
// Security Middleware
// =============================================================================

// Helmet adds various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for SSE compatibility
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/rooms', limiter); // Apply to /rooms endpoints

// =============================================================================
// General Middleware
// =============================================================================

app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));
app.use(express.static(path.join(__dirname, '../public')));

// Request logging (skip in test environment)
if (config.logging.enabled && config.nodeEnv !== 'test') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// =============================================================================
// Initialize Room Manager
// =============================================================================

const roomManager = RoomManager.Instance;

// =============================================================================
// Routes
// =============================================================================

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

app.get('/rooms', (_req: Request, res: Response) => {
  res.json(Array.from(RoomManager.allRooms.keys()));
});

app.post('/rooms', (req: Request, res: Response) => {
  const { id, type } = req.body;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing or invalid room id' });
    return;
  }

  const roomType: RoomType = type === 'tictactoe' ? 'tictactoe' : 'sse';
  try {
    RoomManager.createRoom(id, roomType);
    res.json({ status: 'ok', id, type: roomType });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get room info
app.get('/rooms/:id', (req: Request, res: Response) => {
  const roomId = req.params.id;
  try {
    const info = RoomManager.getRoomInfo(roomId);
    res.json(info);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Delete a room
app.delete('/rooms/:id', (req: Request, res: Response) => {
  const roomId = req.params.id;
  try {
    RoomManager.deleteRoom(roomId);
    res.json({ status: 'ok', id: roomId });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// SSE subscription endpoint
app.get('/rooms/:id/subscribe', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: 'Missing userId query parameter' });
    return;
  }

  const client: Client = { id: userId, sse: res };

  try {
    RoomManager.joinRoom(roomId, client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ event: 'connected', userId, roomId })}\n\n`);

  // Keep-alive ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ event: 'ping', t: Date.now() })}\n\n`);
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    try {
      RoomManager.leaveRoom(roomId, client);
    } catch {
      // Client already removed
    }
  });
});

// Send action to room (for game moves)
app.post('/rooms/:id/action', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { userId, action } = req.body;

  if (!userId || action === undefined) {
    res.status(400).json({ error: 'Missing userId or action' });
    return;
  }

  const client: Client = { id: userId };

  try {
    RoomManager.receive(roomId, client, action);
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reset game room
app.post('/rooms/:id/reset', (req: Request, res: Response) => {
  const roomId = req.params.id;
  try {
    RoomManager.resetRoom(roomId);
    res.json({ status: 'ok', id: roomId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Broadcast message to room
app.post('/rooms/:id/broadcast', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { userId, message } = req.body;

  if (!userId || message === undefined) {
    res.status(400).json({ error: 'Missing userId or message' });
    return;
  }

  try {
    RoomManager.broadcast(roomId, { from: userId, message });
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  if (!config.isProduction) {
    console.error(err.stack);
  }
  res.status(500).json({ error: 'Internal server error' });
});

// =============================================================================
// Server Startup & Graceful Shutdown
// =============================================================================

let server: ReturnType<typeof app.listen> | null = null;

function startServer() {
  server = app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
  return server;
}

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.log('HTTP server closed');

      // Clear all room timers
      for (const [, room] of RoomManager.allRooms) {
        if ('destroy' in room && typeof room.destroy === 'function') {
          room.destroy();
        }
      }
      RoomManager.clearAllRooms();

      console.log('Cleanup complete. Exiting.');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Only start server if this file is run directly (not imported for tests)
if (require.main === module) {
  startServer();
}

export default app;
export { startServer, gracefulShutdown };
