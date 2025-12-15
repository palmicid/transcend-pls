import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://placeholder@invalid/placeholder" // fallback for build phase

const adapter = new PrismaPg({
  connectionString,
})

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
