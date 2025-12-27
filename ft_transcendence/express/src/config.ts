/**
 * Application configuration with environment variable support.
 */
export const config = {
  /** Server port */
  port: parseInt(process.env.PORT || '3001', 10),

  /** Node environment */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** Is production mode */
  isProduction: process.env.NODE_ENV === 'production',

  /** Rate limiting settings */
  rateLimit: {
    /** Time window in milliseconds (default: 1 minute) */
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    /** Max requests per window (default: 100) */
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  /** CORS settings */
  cors: {
    /** Allowed origins (comma-separated in env) */
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  },

  /** Logging settings */
  logging: {
    /** Enable request logging */
    enabled: process.env.DISABLE_LOGGING !== 'true',
  },
};
