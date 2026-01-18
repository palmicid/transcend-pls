import { SSERoom } from './rooms/SSERoom';
import { TicTacToeRoom } from './rooms/TicTacToeRoom';
import { UserConn } from './rooms/types';

export { UserConn, Client, Publisher } from './rooms/types';
export { SSERoom } from './rooms/SSERoom';
export { TicTacToeRoom } from './rooms/TicTacToeRoom';

export type RoomType = 'sse' | 'tictactoe';

/**
 * Singleton manager for all game rooms.
 */
export class RoomManager {
  private static instance: RoomManager;
  private static rooms: Map<string, SSERoom> = new Map();
  private static roomTypes: Map<string, RoomType> = new Map();

  private constructor() {
    RoomManager.instance = this;
  }

  public static get Instance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public static get allRooms(): Map<string, SSERoom> {
    return RoomManager.rooms;
  }

  public static getRoom(id: string): SSERoom {
    const room = RoomManager.rooms.get(id);
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }

  public static getRoomType(id: string): RoomType {
    const roomType = RoomManager.roomTypes.get(id);
    if (!roomType) {
      throw new Error('Room not found');
    }
    return roomType;
  }

  public static getRoomInfo(id: string): { id: string; type: RoomType; clientCount: number; state?: any } {
    const room = RoomManager.getRoom(id);
    const roomType = RoomManager.getRoomType(id);
    const info: { id: string; type: RoomType; clientCount: number; state?: any } = {
      id,
      type: roomType,
      clientCount: room.clientCount,
    };

    // Include game state for TicTacToe rooms
    if (room instanceof TicTacToeRoom) {
      info.state = (room as any).getGameState?.() || null;
    }

    return info;
  }

  public static createRoom(id: string, type: RoomType = 'sse'): SSERoom {
    try {
      RoomManager.getRoom(id);
    } catch (error) {
      const room = type === 'tictactoe' ? new TicTacToeRoom() : new SSERoom();
      RoomManager.rooms.set(id, room);
      RoomManager.roomTypes.set(id, type);
      return room;
    }
    throw new Error('Room already exists');
  }

  public static deleteRoom(id: string): void {
    const room = RoomManager.getRoom(id);
    // Disconnect all clients before deletion
    RoomManager.rooms.delete(id);
    RoomManager.roomTypes.delete(id);
  }

  public static joinRoom(id: string, conn: UserConn): void {
    RoomManager.getRoom(id).subscribe(conn);
  }

  public static leaveRoom(id: string, conn: UserConn): void {
    RoomManager.getRoom(id).unsubscribe(conn);
  }

  public static broadcast(id: string, raw: any): void {
    RoomManager.getRoom(id).broadcast(raw);
  }

  public static receive(id: string, conn: UserConn, raw: any): void {
    RoomManager.getRoom(id).receive(conn, raw);
  }

  public static resetRoom(id: string): void {
    const room = RoomManager.getRoom(id);
    if (room instanceof TicTacToeRoom) {
      room.reset();
    } else {
      throw new Error('Room does not support reset');
    }
  }

  /** Clear all rooms - used for testing */
  public static clearAllRooms(): void {
    RoomManager.rooms.clear();
    RoomManager.roomTypes.clear();
  }
}

