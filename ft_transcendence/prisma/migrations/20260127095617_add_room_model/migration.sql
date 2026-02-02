/*
  Warnings:

  - The primary key for the `Room` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `maxUsers` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `online` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ChatMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RoomToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `owner_id` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "GameResult" DROP CONSTRAINT "GameResult_roomId_fkey";

-- DropForeignKey
ALTER TABLE "GameResult" DROP CONSTRAINT "GameResult_winnerId_fkey";

-- DropForeignKey
ALTER TABLE "_RoomToUser" DROP CONSTRAINT "_RoomToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_RoomToUser" DROP CONSTRAINT "_RoomToUser_B_fkey";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Room" DROP CONSTRAINT "Room_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "maxUsers",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
ADD COLUMN     "board_state" JSONB,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "current_turn" TEXT,
ADD COLUMN     "game_type" TEXT NOT NULL DEFAULT 'tic-tac-toe',
ADD COLUMN     "max_players" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "owner_id" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "winner_role" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ADD CONSTRAINT "Room_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Room_id_seq";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "displayName",
DROP COLUMN "name",
DROP COLUMN "online",
DROP COLUMN "updatedAt",
DROP COLUMN "username",
ADD COLUMN     "avatar_url" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "display_name" TEXT NOT NULL DEFAULT 'player',
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "online_status" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "secret" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "password" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "ChatMessage";

-- DropTable
DROP TABLE "ChatSession";

-- DropTable
DROP TABLE "GameResult";

-- DropTable
DROP TABLE "_RoomToUser";

-- DropEnum
DROP TYPE "RoomType";

-- CreateTable
CREATE TABLE "FriendRelation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "friend_id" INTEGER NOT NULL,
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FriendRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game_ttt" (
    "id" SERIAL NOT NULL,
    "player1_id" INTEGER NOT NULL,
    "player2_id" INTEGER NOT NULL,
    "winner_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_ttt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game_rps" (
    "id" SERIAL NOT NULL,
    "player1_id" INTEGER NOT NULL,
    "player2_id" INTEGER NOT NULL,
    "winner_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_rps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth" (
    "oauth_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "granted_scopes" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "oauth_pkey" PRIMARY KEY ("oauth_id")
);

-- CreateTable
CREATE TABLE "RoomPlayer" (
    "id" SERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendRelation_user_id_friend_id_key" ON "FriendRelation"("user_id", "friend_id");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPlayer_room_id_user_id_key" ON "RoomPlayer"("room_id", "user_id");

-- AddForeignKey
ALTER TABLE "FriendRelation" ADD CONSTRAINT "FriendRelation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRelation" ADD CONSTRAINT "FriendRelation_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game_ttt" ADD CONSTRAINT "Game_ttt_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game_ttt" ADD CONSTRAINT "Game_ttt_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game_ttt" ADD CONSTRAINT "Game_ttt_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game_rps" ADD CONSTRAINT "Game_rps_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game_rps" ADD CONSTRAINT "Game_rps_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game_rps" ADD CONSTRAINT "Game_rps_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth" ADD CONSTRAINT "oauth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
