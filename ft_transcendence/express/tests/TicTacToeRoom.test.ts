import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TicTacToeRoom } from '../src/lib/rooms/TicTacToeRoom';
import { UserConn } from '../src/lib/rooms/types';
import { Response } from 'express';

/**
 * Creates a mock UserConn with a mocked SSE Response object.
 */
function createMockConn(id: string): UserConn {
  const mockRes = {
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
  } as unknown as Response;

  return { id, sse: mockRes };
}

describe('TicTacToeRoom', () => {
  let room: TicTacToeRoom;

  beforeEach(() => {
    vi.useFakeTimers();
    room = new TicTacToeRoom();
  });

  afterEach(() => {
    room.destroy();
    vi.useRealTimers();
  });

  describe('Subscription', () => {
    it('should assign X to first player', () => {
      const player1 = createMockConn('player1');
      room.subscribe(player1);

      expect(room.clientCount).toBe(1);
    });

    it('should assign O to second player', () => {
      const player1 = createMockConn('player1');
      const player2 = createMockConn('player2');

      room.subscribe(player1);
      room.subscribe(player2);

      expect(room.clientCount).toBe(2);
    });

    it('should reject third player', () => {
      const player1 = createMockConn('player1');
      const player2 = createMockConn('player2');
      const player3 = createMockConn('player3');

      room.subscribe(player1);
      room.subscribe(player2);

      expect(() => room.subscribe(player3)).toThrow('Room is unable to join');
    });

    it('should reject duplicate player', () => {
      const player1 = createMockConn('player1');
      room.subscribe(player1);

      expect(() => room.subscribe(player1)).toThrow('Client already connected');
    });
  });

  describe('Move Validation', () => {
    let player1: UserConn;
    let player2: UserConn;

    beforeEach(() => {
      player1 = createMockConn('player1');
      player2 = createMockConn('player2');
      room.subscribe(player1);
      room.subscribe(player2);
    });

    it('should reject move before game starts', () => {
      const soloRoom = new TicTacToeRoom();
      const soloPlayer = createMockConn('solo');
      soloRoom.subscribe(soloPlayer);

      expect(() => soloRoom.receive(soloPlayer, { type: 'MOVE', position: 0 }))
        .toThrow('Game has not started yet');

      soloRoom.destroy();
    });

    it('should accept valid move from X player', () => {
      expect(() => room.receive(player1, { type: 'MOVE', position: 0 })).not.toThrow();
    });

    it('should reject move from wrong player', () => {
      expect(() => room.receive(player2, { type: 'MOVE', position: 0 }))
        .toThrow('Not your turn');
    });

    it('should reject invalid position (negative)', () => {
      expect(() => room.receive(player1, { type: 'MOVE', position: -1 }))
        .toThrow('Invalid position');
    });

    it('should reject invalid position (>8)', () => {
      expect(() => room.receive(player1, { type: 'MOVE', position: 9 }))
        .toThrow('Invalid position');
    });

    it('should reject move on occupied cell', () => {
      room.receive(player1, { type: 'MOVE', position: 0 }); // X plays
      room.receive(player2, { type: 'MOVE', position: 1 }); // O plays

      expect(() => room.receive(player1, { type: 'MOVE', position: 0 }))
        .toThrow('Cell is already occupied');
    });

    it('should reject invalid message type', () => {
      expect(() => room.receive(player1, { type: 'INVALID', position: 0 }))
        .toThrow('Invalid message type');
    });
  });

  describe('Turn Alternation', () => {
    let player1: UserConn;
    let player2: UserConn;

    beforeEach(() => {
      player1 = createMockConn('player1');
      player2 = createMockConn('player2');
      room.subscribe(player1);
      room.subscribe(player2);
    });

    it('should alternate turns correctly', () => {
      room.receive(player1, { type: 'MOVE', position: 0 }); // X
      room.receive(player2, { type: 'MOVE', position: 1 }); // O
      room.receive(player1, { type: 'MOVE', position: 2 }); // X

      // After X plays, it should be O's turn
      expect(() => room.receive(player1, { type: 'MOVE', position: 3 }))
        .toThrow('Not your turn');
    });
  });

  describe('Win Detection', () => {
    let player1: UserConn;
    let player2: UserConn;

    beforeEach(() => {
      player1 = createMockConn('player1');
      player2 = createMockConn('player2');
      room.subscribe(player1);
      room.subscribe(player2);
    });

    it('should detect X win (top row)', () => {
      room.receive(player1, { type: 'MOVE', position: 0 }); // X
      room.receive(player2, { type: 'MOVE', position: 3 }); // O
      room.receive(player1, { type: 'MOVE', position: 1 }); // X
      room.receive(player2, { type: 'MOVE', position: 4 }); // O
      room.receive(player1, { type: 'MOVE', position: 2 }); // X wins

      expect(() => room.receive(player2, { type: 'MOVE', position: 5 }))
        .toThrow('Game has already ended');
    });

    it('should detect X win (diagonal)', () => {
      room.receive(player1, { type: 'MOVE', position: 0 }); // X
      room.receive(player2, { type: 'MOVE', position: 1 }); // O
      room.receive(player1, { type: 'MOVE', position: 4 }); // X
      room.receive(player2, { type: 'MOVE', position: 2 }); // O
      room.receive(player1, { type: 'MOVE', position: 8 }); // X wins

      expect(() => room.receive(player2, { type: 'MOVE', position: 3 }))
        .toThrow('Game has already ended');
    });

    it('should detect O win', () => {
      room.receive(player1, { type: 'MOVE', position: 0 }); // X
      room.receive(player2, { type: 'MOVE', position: 3 }); // O
      room.receive(player1, { type: 'MOVE', position: 1 }); // X
      room.receive(player2, { type: 'MOVE', position: 4 }); // O
      room.receive(player1, { type: 'MOVE', position: 8 }); // X (no win)
      room.receive(player2, { type: 'MOVE', position: 5 }); // O wins

      expect(() => room.receive(player1, { type: 'MOVE', position: 2 }))
        .toThrow('Game has already ended');
    });
  });

  describe('Draw Detection', () => {
    it('should detect a draw', () => {
      const player1 = createMockConn('player1');
      const player2 = createMockConn('player2');
      room.subscribe(player1);
      room.subscribe(player2);

      // Board layout for draw:
      // X | O | X
      // X | X | O
      // O | X | O
      room.receive(player1, { type: 'MOVE', position: 0 }); // X
      room.receive(player2, { type: 'MOVE', position: 1 }); // O
      room.receive(player1, { type: 'MOVE', position: 2 }); // X
      room.receive(player2, { type: 'MOVE', position: 5 }); // O
      room.receive(player1, { type: 'MOVE', position: 3 }); // X
      room.receive(player2, { type: 'MOVE', position: 6 }); // O
      room.receive(player1, { type: 'MOVE', position: 4 }); // X
      room.receive(player2, { type: 'MOVE', position: 8 }); // O
      room.receive(player1, { type: 'MOVE', position: 7 }); // X - draw

      expect(() => room.receive(player2, { type: 'MOVE', position: 0 }))
        .toThrow('Game has already ended');
    });
  });

  describe('Disconnect Handling', () => {
    let player1: UserConn;
    let player2: UserConn;

    beforeEach(() => {
      player1 = createMockConn('player1');
      player2 = createMockConn('player2');
      room.subscribe(player1);
      room.subscribe(player2);
    });

    it('should allow reconnection within timeout window', () => {
      room.receive(player1, { type: 'MOVE', position: 0 }); // Game in progress
      room.unsubscribe(player1); // X disconnects

      // Player reconnects before timeout
      const player1Reconnect = createMockConn('player1');
      room.subscribe(player1Reconnect);

      // Game should still be in progress, X already played so it's O's turn
      expect(() => room.receive(player2, { type: 'MOVE', position: 1 })).not.toThrow();
    });

    it('should forfeit after disconnect timeout expires', () => {
      room.receive(player1, { type: 'MOVE', position: 0 }); // Game in progress
      room.unsubscribe(player1); // X disconnects

      // Advance time past disconnect timeout
      vi.advanceTimersByTime(TicTacToeRoom.DISCONNECT_TIMEOUT_MS + 100);

      // Game should be over - O wins by forfeit
      expect(() => room.receive(player2, { type: 'MOVE', position: 1 }))
        .toThrow('Game has already ended');
    });

    it('should broadcast disconnect and reconnect events', () => {
      room.receive(player1, { type: 'MOVE', position: 0 });
      const writeSpy = vi.spyOn(player2.sse!, 'write');

      room.unsubscribe(player1);

      // Should have broadcast PLAYER_DISCONNECTED
      expect(writeSpy).toHaveBeenCalledWith(
        expect.stringContaining('PLAYER_DISCONNECTED')
      );

      const player1Reconnect = createMockConn('player1');
      room.subscribe(player1Reconnect);

      // Should have broadcast PLAYER_RECONNECTED
      expect(writeSpy).toHaveBeenCalledWith(
        expect.stringContaining('PLAYER_RECONNECTED')
      );
    });
  });

  describe('Turn Timer', () => {
    let player1: UserConn;
    let player2: UserConn;

    beforeEach(() => {
      player1 = createMockConn('player1');
      player2 = createMockConn('player2');
      room.subscribe(player1);
      room.subscribe(player2);
    });

    it('should forfeit current player on turn timeout', () => {
      // X's turn, timeout expires
      vi.advanceTimersByTime(TicTacToeRoom.TURN_TIMEOUT_MS + 100);

      // X should lose by timeout, O wins
      expect(() => room.receive(player1, { type: 'MOVE', position: 0 }))
        .toThrow('Game has already ended');
    });

    it('should reset timer when player makes a move', () => {
      // Advance partial time
      vi.advanceTimersByTime(TicTacToeRoom.TURN_TIMEOUT_MS - 1000);

      // X makes a move (resets timer for O)
      room.receive(player1, { type: 'MOVE', position: 0 });

      // Advance more time (but less than full timeout from O's turn)
      vi.advanceTimersByTime(TicTacToeRoom.TURN_TIMEOUT_MS - 1000);

      // O should still be able to play
      expect(() => room.receive(player2, { type: 'MOVE', position: 1 })).not.toThrow();
    });

    it('should include turn time remaining in game state', () => {
      vi.advanceTimersByTime(10000); // Advance 10 seconds

      const state = room.getGameState();

      expect(state.turnTimeRemaining).toBeDefined();
      expect(state.turnTimeRemaining).toBeLessThanOrEqual(TicTacToeRoom.TURN_TIMEOUT_MS - 10000);
    });
  });

  describe('Game Reset', () => {
    it('should reset the game state', () => {
      const player1 = createMockConn('player1');
      const player2 = createMockConn('player2');
      room.subscribe(player1);
      room.subscribe(player2);

      // Play some moves
      room.receive(player1, { type: 'MOVE', position: 0 });
      room.receive(player2, { type: 'MOVE', position: 1 });

      // Reset
      room.reset();

      // Should be able to play again from start
      expect(() => room.receive(player1, { type: 'MOVE', position: 0 })).not.toThrow();
    });

    it('should clear all timers on reset', () => {
      const player1 = createMockConn('player1');
      const player2 = createMockConn('player2');
      room.subscribe(player1);
      room.subscribe(player2);

      // Advance partial time
      vi.advanceTimersByTime(TicTacToeRoom.TURN_TIMEOUT_MS - 1000);

      // Reset
      room.reset();

      // Advance past what would have been timeout
      vi.advanceTimersByTime(5000);

      // Game should still be playable
      expect(() => room.receive(player1, { type: 'MOVE', position: 0 })).not.toThrow();
    });
  });
});

