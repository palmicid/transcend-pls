import pino from 'pino';

/**
 * Application logger using pino.
 *
 * Note: We don't use pino-pretty transport here because it uses worker threads
 * which are not compatible with Next.js server components.
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export default logger;
