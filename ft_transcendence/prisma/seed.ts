// import "dotenv/config"; // 👈 ADD THIS
import { PrismaClient } from "@prisma/client";
import {PrismaPg } from "@prisma/adapter-pg";
import { Prisma } from "@prisma/client/extension";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {

  //   // clean up existing data
  await prisma.$transaction([
    // prisma.chatMessage.deleteMany(),
    // prisma.chatSession.deleteMany(),
    // prisma.gameResult.deleteMany(),
    // prisma.room.deleteMany(),
    prisma.User.deleteMany(),
  ]);

  console.log('Start seeding... 🌱')
  await prisma.user.createMany({
    data: [
      { email: "mobile@example.com",
        username: "mobile",
        displayName: "Mobile",
        password: "mobile123",
        online_status: true, },
      { email: "ohm@example.com",
        username: "ohm",
        displayName: "Ohm",
        password: "ohm123",
        online_status: true, },
      { email: "palm@example.com",
        username: "palm",
        displayName: "Palm",
        password: "palm123",
        online_status: false, },
      { email: "grammy@example.com",
        username: "grammy",
        displayName: "Grammy",
        password: "grammy123",
        online_status: false,},
      { email: "sound@example.com",
        username: "sound",
        displayName: "Sound",
        password: "sound123",
        online_status: false,}
    ],
    skipDuplicates: true,
  });

  
  console.log('Seeding finished! ✅')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });


// // import prisma from "../lib/prisma";
// // import { RoomType } from "@prisma/client";

// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   // clean up existing data
//   await prisma.$transaction([
//     // prisma.chatMessage.deleteMany(),
//     // prisma.chatSession.deleteMany(),
//     // prisma.gameResult.deleteMany(),
//     // prisma.room.deleteMany(),
//     prisma.User.deleteMany(),
//   ]);


//   // --- Users (mock login) --- // mock only
//   const [mobile, ohm, palm, grammy, sound] = await Promise.all([
//     prisma.User.create({
//       data: {
//         email: "mobile@example.com",
//         username: "mobile",
//         displayName: "Mobile",
//         password: "mobile123",
//         online_status: true,
//       },
//     }),
//     prisma.User.create({
//       data: {
//         email: "ohm@example.com",
//         username: "ohm",
//         displayName: "Ohm",
//         password: "ohm123",
//         online_status: true,
//       },
//     }),
//     prisma.User.create({
//       data: {
//         email: "palm@example.com",
//         username: "palm",
//         displayName: "Palm",
//         password: "palm123",
//         online_status: false,
//       },
//     }),
//     prisma.User.create({
//       data: {
//         email: "grammy@example.com",
//         username: "grammy",
//         displayName: "Grammy",
//         password: "grammy123",
//         online_status: false,
//       },
//     }),
//     prisma.User.create({
//       data: {
//         email: "sound@example.com",
//         username: "sound",
//         displayName: "Sound",
//         password: "sound123",
//         online_status: false,
//       },
//     }),
//   ]);

//   // friendships mock
//   // await prisma.FriendRelation.create({
//   //   data; {
      
//   //   }
//   // })

//   // // --- Rooms ---
//   // const TicTacToeRoom = await prisma.room.create({
//   //   data: {
//   //     name: "Tic-Tac-Toe #1",
//   //     type: RoomType.TIC_TAC_TOE,
//   //     maxUsers: 2,
//   //     members: { connect: [{ id: mobile.id }, { id: ohm.id }] },
//   //   },
//   // });

//   // const [lobby1, lobby2] = await prisma.$transaction([
//   //   prisma.room.create({
//   //     data: {
//   //       name: "Lobby #1",
//   //       type: RoomType.GENERIC,
//   //       maxUsers: 10,
//   //       members: { connect: [{ id: ohm.id }, { id: palm.id }, { id: grammy.id }] },
//   //     },
//   //   }),
//   //   prisma.room.create({
//   //     data: {
//   //       name: "Lobby #2",
//   //       type: RoomType.GENERIC,
//   //       maxUsers: 10,
//   //       members: { connect: [{ id: mobile.id }, { id: sound.id }] },
//   //     },
//   //   }),
//   // ]);

//   // // --- Chat session + messages (for chat) ---
//   // const chat = await prisma.chatSession.create({
//   //   data: { userId: mobile.id },
//   // });

//   // await prisma.chatMessage.createMany({
//   //   data: [
//   //     { sessionId: chat.id, role: "user", content: "Hi! Can we play Tic-Tac-Toe?" },
//   //     { sessionId: chat.id, role: "assistant", content: "Sure! Join Tic-Tac-Toe #1 😄" },
//   //     { sessionId: chat.id, role: "user", content: "Let’s go!" },
//   //   ],
//   // });

//   // --- Game result (for play game / history) ---
//   // await prisma.gameResult.create({
//   //   data: {
//   //     roomId: TicTacToeRoom.id,
//   //     gameType: "TIC_TAC_TOE",
//   //     winnerId: mobile.id,
//   //     durationMs: 120000,
//   //     resultData: { score: [11, 7], mode: "ranked" },
//   //   },
//   // });

// //   console.log("Seeded OK:", {
// //     users: [mobile.email, ohm.email, palm.email, grammy.email, sound.email],
// //     rooms: [TicTacToeRoom.name, lobby1.name, lobby2.name],
// //     chatSessionId: chat.id,
// //   });

// // }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => prisma.$disconnect()); }


