import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import { getGameHistory, getPlayerStats } from '@/lib/game/getGameHistory';

vi.mock('@/lib/prisma', () => ({
  default: {
    gameResult: {
      findMany: vi.fn(),
    },
  },
}));

describe('getGameHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should normalize opponent, result, and final board for player1', async () => {
    (prisma.gameResult.findMany as any).mockResolvedValue([
      {
        id: 10,
        game_type: 'tic-tac-toe',
        room_id: 'room-10',
        winner_id: 1,
        is_draw: false,
        duration_ms: 120000,
        started_at: new Date('2026-03-10T10:00:00Z'),
        ended_at: new Date('2026-03-10T10:02:00Z'),
        final_board: ['X', 'O', 'X', 'O', 'X', null, null, null, null],
        player1: { id: 1, display_name: 'Alice' },
        player2: { id: 2, display_name: 'Bob' },
      },
    ]);

    const history = await getGameHistory(1, { limit: 5 });

    expect(prisma.gameResult.findMany).toHaveBeenCalled();
    expect(history).toEqual([
      {
        id: 10,
        gameType: 'tic-tac-toe',
        roomId: 'room-10',
        winnerId: 1,
        isDraw: false,
        durationMs: 120000,
        startedAt: new Date('2026-03-10T10:00:00Z'),
        endedAt: new Date('2026-03-10T10:02:00Z'),
        result: 'win',
        opponent: { id: 2, displayName: 'Bob' },
        finalBoard: ['X', 'O', 'X', 'O', 'X', null, null, null, null],
      },
    ]);
  });

  it('should normalize loss and opponent for player2', async () => {
    (prisma.gameResult.findMany as any).mockResolvedValue([
      {
        id: 11,
        game_type: 'connect4',
        room_id: 'room-11',
        winner_id: 1,
        is_draw: false,
        duration_ms: 45000,
        started_at: new Date('2026-03-10T11:00:00Z'),
        ended_at: new Date('2026-03-10T11:00:45Z'),
        final_board: [['Red']],
        player1: { id: 1, display_name: 'Alice' },
        player2: { id: 2, display_name: 'Bob' },
      },
    ]);

    const history = await getGameHistory(2);

    expect(history[0]).toMatchObject({
      result: 'loss',
      opponent: { id: 1, displayName: 'Alice' },
      finalBoard: [['Red']],
    });
  });
});

describe('getPlayerStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compute wins, losses, draws, rates, and average duration', async () => {
    (prisma.gameResult.findMany as any).mockResolvedValue([
      { winner_id: 1, is_draw: false, duration_ms: 60000 },
      { winner_id: 2, is_draw: false, duration_ms: 120000 },
      { winner_id: null, is_draw: true, duration_ms: 30000 },
    ]);

    const stats = await getPlayerStats(1);

    expect(stats).toEqual({
      wins: 1,
      losses: 1,
      draws: 1,
      total: 3,
      winRate: 33,
      nonLossRate: 67,
      averageDurationMs: 70000,
    });
  });
});
