-- Recreate GameResult if it was dropped by earlier migrations.
CREATE TABLE IF NOT EXISTS "GameResult" (
		"id" SERIAL NOT NULL,
		"game_type" TEXT NOT NULL,
		"room_id" TEXT,
		"player1_id" INTEGER NOT NULL,
		"player2_id" INTEGER NOT NULL,
		"winner_id" INTEGER,
		"is_draw" BOOLEAN NOT NULL DEFAULT false,
		"duration_ms" INTEGER,
		"started_at" TIMESTAMP(3) NOT NULL,
		"ended_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"final_board" JSONB,

		CONSTRAINT "GameResult_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GameResult"
ADD COLUMN IF NOT EXISTS "final_board" JSONB;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'GameResult_player1_id_fkey'
	) THEN
		ALTER TABLE "GameResult"
		ADD CONSTRAINT "GameResult_player1_id_fkey"
		FOREIGN KEY ("player1_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'GameResult_player2_id_fkey'
	) THEN
		ALTER TABLE "GameResult"
		ADD CONSTRAINT "GameResult_player2_id_fkey"
		FOREIGN KEY ("player2_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'GameResult_winner_id_fkey'
	) THEN
		ALTER TABLE "GameResult"
		ADD CONSTRAINT "GameResult_winner_id_fkey"
		FOREIGN KEY ("winner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS "GameResult_player1_id_idx" ON "GameResult"("player1_id");
CREATE INDEX IF NOT EXISTS "GameResult_player2_id_idx" ON "GameResult"("player2_id");
CREATE INDEX IF NOT EXISTS "GameResult_winner_id_idx" ON "GameResult"("winner_id");
CREATE INDEX IF NOT EXISTS "GameResult_game_type_idx" ON "GameResult"("game_type");
CREATE INDEX IF NOT EXISTS "GameResult_room_id_idx" ON "GameResult"("room_id");
