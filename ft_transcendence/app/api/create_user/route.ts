import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

// // GET  →  list all users
// export async function GET() {
//   const users = await prisma.users.findMany()
//   return Response.json(users)
// }

// // POST  →  create a new user
// export async function POST(req: Request) {
//   try {
//     const data = await req.json()
//     const { username } = data

//     if (!username ) {
//       return Response.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       )
//     }

//     // Hash password (recommended — example only)
//     // const hashed = await bcrypt.hash(password, 10)

//     const user = await prisma.users.create({
//       data: {
//         username,
//       },
//     })

//     return Response.json(user, { status: 201 })
//   } catch (err) {
//     console.error('[POST /api/users]', err)
//     return Response.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }
