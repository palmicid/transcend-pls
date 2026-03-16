
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnect4Room, submitConnect4Move } from '@/app/play/connect4/actions';


const { mockPrisma, mockGetSession, mockRoomManager, mockBroadcaster, mockLoadAndValidateRoom } = vi.hoisted(() => {
  return {
    mockPrisma: {
        room: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        roomPlayer: {
            deleteMany: vi.fn(),
            findUnique: vi.fn(),
        }
    },
    mockGetSession: vi.fn(),
    mockRoomManager: {
        attachGame: vi.fn(),
        getRoom: vi.fn(),
        destroyRoom: vi.fn(),
        removePlayer: vi.fn(),
        createRoomRecord: vi.fn(),
        persistStateToDb: vi.fn(),
    },
    mockBroadcaster: {
        broadcast: vi.fn(),
    },
    mockLoadAndValidateRoom: vi.fn(),
  }
});

// Mock the modules
vi.mock('@/lib/prisma', () => ({ default: mockPrisma }));
vi.mock('@/lib/auth/auth-session', () => ({ getSession: mockGetSession }));
vi.mock('@/lib/rooms', () => ({
  roomManager: mockRoomManager,
  loadAndValidateRoom: mockLoadAndValidateRoom,
  Room: vi.fn(), // If used directly
}));
vi.mock('@/lib/broadcast', () => ({ broadcaster: mockBroadcaster }));

const mockRoomInstance = {
    id: 'room-123',
    status: 'IN_GAME',
    submitAction: vi.fn(),
    getSnapshot: vi.fn(),
    start: vi.fn(),
    end: vi.fn(),
    isTerminal: vi.fn(),
};

describe('Connect4 Server Actions', () => {

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetSession.mockResolvedValue({ userId: 123 });
    mockLoadAndValidateRoom.mockResolvedValue(mockRoomInstance);
  });

  describe('createConnect4Room', () => {
      it('should create a room and attach game', async () => {
          mockPrisma.user.findUnique.mockResolvedValue({ id: 123, displayName: "Test User" });
          mockRoomManager.createRoomRecord.mockResolvedValue({ id: 'room-new', game_type: 'connect4' });

          const result = await createConnect4Room();

          expect(mockRoomManager.createRoomRecord).toHaveBeenCalledWith(expect.objectContaining({
              gameType: 'connect4',
              currentTurn: 'Red'
          }));
          expect(mockRoomManager.attachGame).toHaveBeenCalled();
          expect(result.ok).toBe(true);
      });

      it('should fail if unauthorized', async () => {
          mockGetSession.mockResolvedValue(null);
          const result = await createConnect4Room();
          expect(result.ok).toBe(false);
          expect(result.error).toBe("Unauthorized");
      });
  });

  describe('submitConnect4Move', () => {
      it('should validate move and sync to db on success', async () => {
          mockRoomInstance.submitAction.mockReturnValue(true);
          mockRoomInstance.getSnapshot.mockReturnValue({
              board: [], currentTurn: 'Red', winner: null, is_draw: false, players: {}
          });
          // Mock findUnique for broadcast and move validation
          const emptyBoard = Array(6).fill(null).map(() => Array(7).fill(null));
          mockPrisma.room.findUnique.mockResolvedValue({
              id: 'room-123',
              players: [],
              board_state: emptyBoard,
              status: 'IN_GAME',
              current_turn: 'Red',
          });
          mockPrisma.roomPlayer.findUnique.mockResolvedValue({
              user_id: 123,
              room_id: 'room-123',
              role: 'Red',
          });
          mockPrisma.user.findUnique.mockResolvedValue({
              id: 123,
              displayName: 'Test User'
          });

          const result = await submitConnect4Move('room-123', '123', 3);

          expect(mockLoadAndValidateRoom).toHaveBeenCalledWith('room-123');
          expect(mockRoomInstance.submitAction).toHaveBeenCalledWith('123', { column: 3 });
          expect(mockRoomManager.persistStateToDb).toHaveBeenCalled(); // Sync
          expect(mockBroadcaster.broadcast).toHaveBeenCalled(); // Broadcast
          expect(result.ok).toBe(true);
      });

      it('should not sync/broadcast on invalid move', async () => {
          mockRoomInstance.submitAction.mockReturnValue(false);

          const result = await submitConnect4Move('room-123', '123', 3);

          expect(result.ok).toBe(false);
          expect(mockPrisma.room.update).not.toHaveBeenCalled();
          expect(mockBroadcaster.broadcast).not.toHaveBeenCalled();
      });

      it('should correctly handle incomplete board state (regression test)', async () => {
          mockRoomInstance.submitAction.mockReturnValue(true);
          // Board partially filled, no winner
          const partialBoard = Array(6).fill(null).map(() => Array(7).fill(null));
          partialBoard[5][0] = 'Red';
          
          mockRoomInstance.getSnapshot.mockReturnValue({
              board: partialBoard, currentTurn: 'Yellow', winner: null, is_draw: false, players: {}
          });
          mockPrisma.room.findUnique.mockResolvedValue({
              id: 'room-123',
              players: [],
              board_state: partialBoard, // Not full
              status: 'IN_GAME',
              current_turn: 'Yellow',
              winner_role: null
          });
          mockPrisma.roomPlayer.findUnique.mockResolvedValue({
              user_id: 123,
              room_id: 'room-123',
              role: 'Yellow',
          });
          mockPrisma.user.findUnique.mockResolvedValue({
              id: 123,
              displayName: 'Test User'
          });

          await submitConnect4Move('room-123', '123', 0);

          expect(mockBroadcaster.broadcast).toHaveBeenCalledWith(
              expect.any(String),
              expect.stringContaining('"isDraw":false')
          );
      });
  });

});
