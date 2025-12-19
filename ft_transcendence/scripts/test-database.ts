import "dotenv/config"
import prisma from "../lib/prisma"

async function testDatabase() {
  console.log("🔍 Testing Prisma connection...\n")

  try {
    const user = await prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Demo User",
      },
    })

    console.log("✅ Created user:", user)

    const users = await prisma.user.findMany()
    console.log(`✅ Found ${users.length} user(s)`)

    process.exit(0)
  } catch (err) {
    console.error("❌ Database test failed:", err)
    process.exit(1)
  }
}

testDatabase()
