# Multi-stage Dockerfile for Next.js with Prisma

FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules ./node_modules

# Create a startup script that runs migrations
COPY <<'EOF' /app/start.sh
#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js server..."
exec node server.js
EOF

RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000
# CMD ["npm", "start"]
# CMD ["node", "./node_modules/.bin/next", "start"]
CMD ["npm", "run", "start"]
# CMD ["npm", "run", "dev"]
