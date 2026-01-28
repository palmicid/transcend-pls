/*
  Warnings:

  - You are about to drop the column `name` on the `Room` table. All the data in the column will be lost.
  - The primary key for the `RoomPlayer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `RoomPlayer` table. All the data in the column will be lost.
  - Made the column `role` on table `RoomPlayer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "RoomPlayer" DROP CONSTRAINT "RoomPlayer_user_id_fkey";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "name",
ADD COLUMN     "bot_delay_ms" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "bot_difficulty" INTEGER,
ADD COLUMN     "bot_role" TEXT,
ALTER COLUMN "board_state" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "RoomPlayer" DROP CONSTRAINT "RoomPlayer_pkey",
DROP COLUMN "id",
ALTER COLUMN "role" SET NOT NULL,
ADD CONSTRAINT "RoomPlayer_pkey" PRIMARY KEY ("room_id", "user_id");

-- AddForeignKey
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
