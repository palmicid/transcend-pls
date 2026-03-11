import { vi, describe, it, expect, beforeEach } from 'vitest';
import { saveGameResult } from './saveGameResult';
import prisma from '../../lib/prisma';

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  default: {
    room: {
      findUnique: vi.fn(),
    },
    gameResult: {
      create: vi.fn(),
    },
  },
}));

describe('saveGameResult', () => {
  const mockDate = new Date('2024-01-01T12:00:00Z');
  const defaults = {
    gameType: 'tic-tac-toe',
    roomId: 'room-1',
    players: [
      { id: 101, role: 'X' },
      { id: 102, role: 'O' },
    ],
    winnerRole: 'X',
    isDraw: false,
    startedAt: mockDate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save result for 2-player remote game', async () => {
    // Mock room: No bot
    (prisma.room.findUnique as any).mockResolvedValue({
      bot_difficulty: null,
      bot_role: null,
    });

    (prisma.gameResult.create as any).mockResolvedValue({ id: 1 });

    const result = await saveGameResult(defaults);

    expect(prisma.room.findUnique).toHaveBeenCalledWith({
      where: { id: 'room-1' },
      select: expect.any(Object),
    });

    expect(prisma.gameResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        game_type: 'tic-tac-toe',
        room_id: 'room-1',
        player1_id: 101,
        player2_id: 102,
        winner_id: 101,
        is_draw: false,
      }),
    });

    expect(result).toEqual({ id: 1 });
  });

  it('should NOT save if bot is configured (difficulty set)', async () => {
    // Mock room: Bot enabled
    (prisma.room.findUnique as any).mockResolvedValue({
      bot_difficulty: 1,
      bot_role: 'O',
    });

    const result = await saveGameResult(defaults);

    expect(prisma.gameResult.create).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should NOT save if not exactly 2 players', async () => {
    const result = await saveGameResult({
      ...defaults,
      players: [{ id: 101, role: 'X' }], // Only 1 player
    });

    expect(prisma.room.findUnique).not.toHaveBeenCalled(); // Should fail fast
    expect(prisma.gameResult.create).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should handle draws correctly', async () => {
    (prisma.room.findUnique as any).mockResolvedValue({
      bot_difficulty: null,
      bot_role: null,
    });

    await saveGameResult({
      ...defaults,
      winnerRole: null,
      isDraw: true,
    });

    expect(prisma.gameResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        winner_id: null,
        is_draw: true,
      }),
    });
  });
});
