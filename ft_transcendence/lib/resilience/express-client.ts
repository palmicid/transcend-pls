/**
 * @file lib/resilience/express-client.ts
 * @description Resilient HTTP client for communicating with Express SSE server.
 *
 * Implements a circuit breaker pattern to prevent cascading failures:
 * - After MAX_FAILURES consecutive failures, the circuit "opens"
 * - While open, requests fail fast without attempting network calls
 * - After RESET_MS, the circuit "half-opens" and allows a retry
 *
 * This ensures Next.js continues working even when Express is down.
 *
 * @example
 * ```ts
 * import { expressClient } from '@/lib/resilience/express-client';
 *
 * // Try to broadcast - returns false if Express is down (no error thrown)
 * const success = await expressClient.broadcast(roomId, { event: 'MOVE', board }, token);
 *
 * // Check if Express is healthy
 * if (!expressClient.isHealthy) {
 *   console.warn('Express server is currently unavailable');
 * }
 * ```
 */

const EXPRESS_URL = process.env.EXPRESS_URL || "http://localhost:3001";

/**
 * Circuit breaker states.
 */
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

/**
 * Resilient client for Express server with circuit breaker.
 */
class ExpressClient {
  private state: CircuitState = "CLOSED";
  private failures = 0;

  /** Number of consecutive failures before opening circuit */
  private readonly MAX_FAILURES = 3;

  /** Time in ms before attempting to reset circuit */
  private readonly RESET_MS = 30000;

  /** Request timeout in ms */
  private readonly TIMEOUT_MS = 3000;

  /**
   * Broadcast a message to a room via Express SSE server.
   *
   * @param roomId - The room to broadcast to
   * @param data - The data to broadcast
   * @param token - SSE token for authentication
   * @returns true if broadcast succeeded, false if failed or circuit is open
   */
  async broadcast(
    roomId: string,
    data: unknown,
    token: string
  ): Promise<boolean> {
    // Fail fast if circuit is open
    if (this.state === "OPEN") {
      return false;
    }

    try {
      const res = await fetch(`${EXPRESS_URL}/event/${roomId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (res.ok) {
        this.onSuccess();
        return true;
      }

      this.onFailure();
      return false;
    } catch {
      this.onFailure();
      return false;
    }
  }

  /**
   * Check if Express server is healthy.
   *
   * @returns true if health check succeeded
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${EXPRESS_URL}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Whether the circuit is closed (Express considered healthy).
   */
  get isHealthy(): boolean {
    return this.state === "CLOSED";
  }

  /**
   * Get the current circuit state for debugging.
   */
  get circuitState(): CircuitState {
    return this.state;
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private onSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;

    if (this.failures >= this.MAX_FAILURES) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state = "OPEN";

    // After RESET_MS, transition to half-open to allow a retry
    setTimeout(() => {
      this.state = "HALF_OPEN";
      this.failures = 0;
    }, this.RESET_MS);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global Express client instance.
 *
 * Uses globalThis to survive Next.js hot-reloading in development.
 */
const globalForExpress = globalThis as unknown as {
  expressClient: ExpressClient | undefined;
};

export const expressClient =
  globalForExpress.expressClient ?? new ExpressClient();

// Preserve instance during development hot-reloads
if (process.env.NODE_ENV !== "production") {
  globalForExpress.expressClient = expressClient;
}

export { EXPRESS_URL };
