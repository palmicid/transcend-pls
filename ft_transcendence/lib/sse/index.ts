/**
 * @file lib/sse/index.ts
 * @description Barrel exports for the Server-Sent Events module.
 *
 * Import from this file for clean, consistent imports:
 * ```ts
 * import { createSSEHandler, SSEMessage } from '@/lib/sse';
 * ```
 */

export {
  createSSEHandler,
  type SSEHandlerOptions,
  type SSEMessage,
} from "./createSSEHandler";
