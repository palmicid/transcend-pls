FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# copy env early so next build can read it
COPY .env .env

COPY . .
RUN npm run build


# 2️⃣ Runner stage – smaller final image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app ./

# Prisma needs the client binaries
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
