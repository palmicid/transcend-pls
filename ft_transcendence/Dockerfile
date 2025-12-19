FROM node:20.19-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# 🔑 Generate Prisma client INSIDE Docker
RUN npx prisma generate

# Build Next.js
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
