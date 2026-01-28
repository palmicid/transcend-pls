import { Response } from 'express';

/**
 * Represents a connected client with an optional SSE stream.
 */
export interface UserConn {
  id: string;
  sse?: Response;
};

/** @deprecated Use UserConn instead */
export type Client = UserConn;

/**
 * Interface for a room that can manage client subscriptions and broadcasts.
 */
export interface Publisher {
  get clientCount(): number;

  subscribe(conn: UserConn): void;
  unsubscribe(conn: UserConn): void;
  broadcast(raw: any): void;
  receive(conn: UserConn, raw: any): void;
}
