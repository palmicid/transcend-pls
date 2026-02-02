/**
 * @file lib/env.ts
 * @description Centralized environment configuration with validation.
 *
 * Uses Zod for runtime validation of environment variables.
 * Fails fast at startup if required variables are missing.
 *
 * @example
 * ```ts
 * import { env } from '@/lib/env';
 *
 * const dbUrl = env.DATABASE_URL;
 * const isProduction = env.NODE_ENV === 'production';
 * ```
 */

import { z } from 'zod';

/**
 * Environment variable schema.
 * Add all required and optional env vars here.
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Server
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().default('0.0.0.0'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Auth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/auth/callback/google'),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/auth/callback/github'),
  FTBK_CLIENT_ID: z.string(),
  FTBK_CLIENT_SECRET: z.string(),
  FTBK_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/auth/callback/42'),
  ENCRYPTION_KEY: z.string(),
  JWT_SECRET: z.string(),
});

/**
 * Validated environment configuration.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables.
 * Throws descriptive error if validation fails.
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.format();
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(errors, null, 2));
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

/**
 * Validated environment configuration.
 * Access this object for type-safe environment variables.
 */
export const env = validateEnv();

export default env;
