
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
        roomPlayer: {
            deleteMany: vi.fn(),
        }
    },
    mockGetSession: vi.fn(),
    mockRoomManager: {
        attachGame: vi.fn(),
        getRoom: vi.fn(),
        destroyRoom: vi.fn(),
        removePlayer: vi.fn(),
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
};

describe('Connect4 Server Actions', () => {

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetSession.mockResolvedValue({ userId: 123 });
    mockLoadAndValidateRoom.mockResolvedValue(mockRoomInstance);
  });

  describe('createConnect4Room', () => {
      it('should create a room and attach game', async () => {
          mockPrisma.room.create.mockResolvedValue({ id: 'room-new', game_type: 'connect4' });

          const result = await createConnect4Room();

          expect(mockPrisma.room.create).toHaveBeenCalledWith(expect.objectContaining({
              data: expect.objectContaining({
                  game_type: 'connect4',
                  current_turn: 'Red'
              })
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
          // Mock findUnique for broadcast
          mockPrisma.room.findUnique.mockResolvedValue({
              id: 'room-123',
              players: [],
              board_state: [],
              status: 'IN_GAME'
          });

          const result = await submitConnect4Move('room-123', '123', 3);

          expect(mockLoadAndValidateRoom).toHaveBeenCalledWith('room-123');
          expect(mockRoomInstance.submitAction).toHaveBeenCalledWith('123', { column: 3 });
          expect(mockPrisma.room.update).toHaveBeenCalled(); // Sync
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
          mockRoomInstance.getSnapshot.mockReturnValue({
              board: [['Red', null], [null, null]], currentTurn: 'Yellow', winner: null, is_draw: false, players: {}
          });
          mockPrisma.room.findUnique.mockResolvedValue({
              id: 'room-123',
              players: [],
              board_state: [['Red', null], [null, null]], // Not full
              status: 'IN_GAME',
              winner_role: null
          });

          await submitConnect4Move('room-123', '123', 0);

          expect(mockBroadcaster.broadcast).toHaveBeenCalledWith(
              expect.any(String),
              expect.stringContaining('"isDraw":false')
          );
      });
  });

});
