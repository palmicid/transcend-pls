DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Room'
      AND column_name = 'bot_difficulty'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE "Room"
    ALTER COLUMN "bot_difficulty" TYPE TEXT
    USING (
      CASE "bot_difficulty"
        WHEN 1 THEN 'Easy'
        WHEN 3 THEN 'Medium'
        WHEN 9 THEN 'Hard'
        ELSE NULL
      END
    );
  END IF;
END $$;
