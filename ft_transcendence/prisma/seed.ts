import prisma from "../lib/prisma";
import { RoomType } from "@prisma/client";

async function main() {
  // clean up existing data
  await prisma.$transaction([
    prisma.chatMessage.deleteMany(),
    prisma.chatSession.deleteMany(),
    prisma.gameResult.deleteMany(),
    prisma.room.deleteMany(),
    prisma.user.deleteMany(),
  ]);


  // --- Users (mock login) --- // mock only
  const [mobile, ohm, palm, grammy, sound] = await Promise.all([
    prisma.user.create({
      data: {
        email: "mobile@example.com",
        username: "mobile",
        displayName: "Mobile",
        password: "mobile123",
        online: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "ohm@example.com",
        username: "ohm",
        displayName: "Ohm",
        password: "ohm123",
        online: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "palm@example.com",
        username: "palm",
        displayName: "Palm",
        password: "palm123",
        online: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "grammy@example.com",
        username: "grammy",
        displayName: "Grammy",
        password: "grammy123",
        online: false,
      },
    }),
    prisma.user.create({
      data: {
        email: "sound@example.com",
        username: "sound",
        displayName: "Sound",
        password: "sound123",
        online: false,
      },
    }),
  ]);

  // --- Rooms ---
  const TicTacToeRoom = await prisma.room.create({
    data: {
      name: "Tic-Tac-Toe #1",
      type: RoomType.TIC_TAC_TOE,
      maxUsers: 2,
      members: { connect: [{ id: mobile.id }, { id: ohm.id }] },
    },
  });

  const [lobby1, lobby2] = await prisma.$transaction([
    prisma.room.create({
      data: {
        name: "Lobby #1",
        type: RoomType.GENERIC,
        maxUsers: 10,
        members: { connect: [{ id: ohm.id }, { id: palm.id }, { id: grammy.id }] },
      },
    }),
    prisma.room.create({
      data: {
        name: "Lobby #2",
        type: RoomType.GENERIC,
        maxUsers: 10,
        members: { connect: [{ id: mobile.id }, { id: sound.id }] },
      },
    }),
  ]);

  // --- Chat session + messages (for chat) ---
  const chat = await prisma.chatSession.create({
    data: { userId: mobile.id },
  });

  await prisma.chatMessage.createMany({
    data: [
      { sessionId: chat.id, role: "user", content: "Hi! Can we play Tic-Tac-Toe?" },
      { sessionId: chat.id, role: "assistant", content: "Sure! Join Tic-Tac-Toe #1 😄" },
      { sessionId: chat.id, role: "user", content: "Let’s go!" },
    ],
  });

  // --- Game result (for play game / history) ---
  await prisma.gameResult.create({
    data: {
      roomId: TicTacToeRoom.id,
      gameType: "TIC_TAC_TOE",
      winnerId: mobile.id,
      durationMs: 120000,
      resultData: { score: [11, 7], mode: "ranked" },
    },
  });

  console.log("Seeded OK:", {
    users: [mobile.email, ohm.email, palm.email, grammy.email, sound.email],
    rooms: [TicTacToeRoom.name, lobby1.name, lobby2.name],
    chatSessionId: chat.id,
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
