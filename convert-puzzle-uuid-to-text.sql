-- Start a transaction to ensure all changes are applied together
BEGIN;

-- Step 1: Drop existing foreign key constraints
ALTER TABLE "public"."active_puzzles" DROP CONSTRAINT IF EXISTS "active_puzzles_puzzle_id_fkey";
ALTER TABLE "public"."puzzle_attempts" DROP CONSTRAINT IF EXISTS "puzzle_attempts_puzzle_id_fkey";
ALTER TABLE "public"."puzzle_feedback" DROP CONSTRAINT IF EXISTS "puzzle_feedback_puzzle_id_fkey";

-- Step 2: Modify the rated_puzzles table
ALTER TABLE "public"."rated_puzzles"
    ALTER COLUMN "id" TYPE text USING id::text;

-- Step 3: Update the active_puzzles table
ALTER TABLE "public"."active_puzzles"
    ALTER COLUMN "puzzle_id" TYPE text USING puzzle_id::text;

-- Step 4: Update the puzzle_attempts table
ALTER TABLE "public"."puzzle_attempts"
    ALTER COLUMN "puzzle_id" TYPE text USING puzzle_id::text;

-- Step 5: Update the puzzle_feedback table
ALTER TABLE "public"."puzzle_feedback"
    ALTER COLUMN "puzzle_id" TYPE text USING puzzle_id::text;

-- Step 6: Recreate the foreign key constraints
ALTER TABLE "public"."active_puzzles"
    ADD CONSTRAINT "active_puzzles_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "public"."rated_puzzles"("id");

ALTER TABLE "public"."puzzle_attempts"
    ADD CONSTRAINT "puzzle_attempts_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "public"."rated_puzzles"("id");

ALTER TABLE "public"."puzzle_feedback"
    ADD CONSTRAINT "puzzle_feedback_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "public"."rated_puzzles"("id");

-- Step 7: Remove the default value for the id column in rated_puzzles
ALTER TABLE "public"."rated_puzzles" 
    ALTER COLUMN "id" DROP DEFAULT;

ALTER TABLE "public"."rated_puzzles" 
	DROP COLUMN r1,
	DROP COLUMN x1,
	DROP COLUMN y1,
	DROP COLUMN r2,
	DROP COLUMN x2,
	DROP COLUMN y2,
    DROP COLUMN board,
	ADD COLUMN current_placement int2 NOT NULL,
	ADD COLUMN next_placement int2 NOT NULL;
	
ALTER TABLE "public"."puzzle_attempts" 
	DROP COLUMN r1,
	DROP COLUMN x1,
	DROP COLUMN y1,
	DROP COLUMN r2,
	DROP COLUMN x2,
	DROP COLUMN y2,
	ADD COLUMN current_placement int2 DEFAULT NULL,
	ADD COLUMN next_placement int2 DEFAULT NULL;

-- Commit the transaction
COMMIT;

-- Note: Remember to update any application code that interacts with these tables to handle text IDs instead of UUIDs
-- and to provide the text ID as a parameter when inserting new puzzles.