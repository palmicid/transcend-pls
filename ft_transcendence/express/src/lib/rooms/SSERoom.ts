import { UserConn, Publisher } from './types';

/**
 * SSE-based room implementation.
 * Manages client connections and broadcasts messages via Server-Sent Events.
 */
export class SSERoom implements Publisher {
  protected clients: Map<string, UserConn> = new Map();

  public get clientCount(): number {
    return this.clients.size;
  }

  protected getClient(id: string): UserConn {
    const client = this.clients.get(id);
    if (!client) {
      throw new Error('Client not found');
    }
    return client;
  }

  public subscribe(conn: UserConn): void {
    if (this.clients.has(conn.id)) {
      throw new Error('Client already connected');
    }

    if (!conn.sse) {
      throw new Error('Client cannot be connected');
    }

    this.clients.set(conn.id, conn);

    conn.sse.setHeader('Content-Type', 'text/event-stream');
    conn.sse.setHeader('Cache-Control', 'no-cache');
    conn.sse.setHeader('Connection', 'keep-alive');
    conn.sse.flushHeaders();
  }

  public unsubscribe(conn: UserConn): void {
    if (!this.clients.has(conn.id)) {
      throw new Error('Client not found');
    }
    this.clients.delete(conn.id);
  }

  public broadcast(raw: any): void {
    const message = `data: ${JSON.stringify(raw)}\n\n`;
    this.clients.forEach((conn) => {
      try {
        conn.sse?.write(message);
      } catch (error) {
        this.unsubscribe(conn);
      }
    });
  }

  public receive(conn: UserConn, raw: any): void {
    if (!this.clients.has(conn.id)) {
      throw new Error('Client not found');
    }
    this.broadcast(raw);
  }
}
