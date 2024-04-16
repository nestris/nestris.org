CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USER TABLE
DROP TABLE IF EXISTS "public"."users" CASCADE;
CREATE TABLE "public"."users" (
    "username" text NOT NULL,
    "last_online" timestamp NOT NULL DEFAULT now(),
    "trophies" int2 NOT NULL DEFAULT 1000,
    "xp" int2 NOT NULL DEFAULT 0,
    "puzzle_elo" int2 NOT NULL DEFAULT 0,
    PRIMARY KEY ("username")
);

-- USER_RELATIONSHIPS table
DROP TABLE IF EXISTS "public"."user_relationships" CASCADE;
CREATE TABLE "public"."user_relationships" (
    "username1" text NOT NULL REFERENCES "public"."users"("username"),
    "username2" text NOT NULL REFERENCES "public"."users"("username"),
    "type" text CHECK (type = ANY (ARRAY['1_send_to_2'::text, '2_send_to_1'::text, 'friends'::text])),
    PRIMARY KEY ("username1","username2")
);

-- PLAYER-CREATED PUZZLE TABLE
DROP TABLE IF EXISTS "public"."player_puzzles" CASCADE;
CREATE TABLE "public"."player_puzzles" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "creator" text NOT NULL REFERENCES "public"."users"("username"), -- if NULL, then it is a system-generated puzzle
    "created_at" timestamp NOT NULL DEFAULT now(),

    "board" bytea NOT NULL,
    "current_piece" char(1) NOT NULL,
    "next_piece" char(1) NOT NULL,
    
    "r1" int2 NOT NULL,
    "x1" int2 NOT NULL,
    "y1" int2 NOT NULL,
    "r2" int2 NOT NULL,
    "x2" int2 NOT NULL,
    "y2" int2 NOT NULL,

    PRIMARY KEY ("id")
);

-- GENERATED RATED PUZZLE TABLE
-- rating is between 1 and 5
DROP TABLE IF EXISTS "public"."rated_puzzles" CASCADE;
CREATE TABLE "public"."rated_puzzles" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" timestamp NOT NULL DEFAULT now(),

    "board" bytea NOT NULL,
    "current_piece" char(1) NOT NULL,
    "next_piece" char(1) NOT NULL,
    
    "r1" int2 NOT NULL,
    "x1" int2 NOT NULL,
    "y1" int2 NOT NULL,
    "r2" int2 NOT NULL,
    "x2" int2 NOT NULL,
    "y2" int2 NOT NULL,

    "rating" int2 NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "theme" text NOT NULL,
    "num_attempts_cached" int2 NOT NULL DEFAULT 0, -- should be updated by trigger on PuzzleAttempt
    "num_solves_cached" int2 NOT NULL DEFAULT 0, -- should be updated by trigger on PuzzleAttempt

    PRIMARY KEY ("id")
);

-- ACTIVE_PUZZLE TABLE
-- puzzle that was fetched by user, but not yet submitted
-- unique username, so that only one active puzzle per user
-- table to ensure that user can only have one active puzzle at a time, and to keep track of when the puzzle was started
DROP TABLE IF EXISTS "public"."active_puzzles" CASCADE;
CREATE TABLE "public"."active_puzzles" (
    "username" text NOT NULL REFERENCES "public"."users"("username"),
    "puzzle_id" uuid NOT NULL REFERENCES "public"."rated_puzzles"("id"),
    "elo_gain" int2 NOT NULL,
    "elo_loss" int2 NOT NULL,
    "started_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("username")
);


-- PUZZLE_ATTEMPT TABLE (for rated puzzles only)
-- user_rating is between -1 and 5
-- -1 means the user reported the puzzle (thought the puzzle was bad)
-- 0 means the user did not rate the puzzle

DROP TABLE IF EXISTS "public"."puzzle_attempts" CASCADE;
CREATE TABLE "public"."puzzle_attempts" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "puzzle_id" uuid NOT NULL REFERENCES "public"."rated_puzzles"("id"),
    "username" text NOT NULL REFERENCES "public"."users"("username"),
    "timestamp" timestamp NOT NULL DEFAULT now(),

    "is_correct" boolean NOT NULL,
    "elo_before" int2 NOT NULL,
    "elo_change" int2, -- if NULL, then it was an unranked puzzle
    "solve_time" int2 NOT NULL,

    "user_rating" int2 NOT NULL DEFAULT 0 CHECK (user_rating >= -1 AND user_rating <= 5),

    "r1" int2 NOT NULL,
    "x1" int2 NOT NULL,
    "y1" int2 NOT NULL,
    "r2" int2 NOT NULL,
    "x2" int2 NOT NULL,
    "y2" int2 NOT NULL,

    PRIMARY KEY ("id")
);


-- calculate the number of attempts and solves for a puzzle
-- do not solve dynamically
CREATE OR REPLACE FUNCTION update_puzzle_cached_data()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rated_puzzles
    SET numAttemptsCached = (SELECT COUNT(*) FROM puzzle_attempts WHERE puzzleID = NEW.puzzleID),
        numSolvesCached = (SELECT COUNT(*) FROM puzzle_attempts WHERE puzzleID = NEW.puzzleID AND isCorrect = TRUE)
    WHERE id = NEW.puzzleID;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger to update the number of attempts and solves for a puzzle
DROP TRIGGER IF EXISTS update_puzzle_cached_data_trigger ON puzzle_attempts;
CREATE TRIGGER update_puzzle_cached_data_trigger
AFTER INSERT OR UPDATE OR DELETE ON puzzle_attempts
FOR EACH ROW EXECUTE FUNCTION update_puzzle_cached_data();

-- FOLDER TABLE
DROP TABLE IF EXISTS "public"."folders" CASCADE;
CREATE TABLE "public"."folders" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "username" text NOT NULL REFERENCES "public"."users"("username"),
    "name" text NOT NULL,
    PRIMARY KEY ("id")
);

-- FOLDER_ITEM TABLE
DROP TABLE IF EXISTS "public"."folder_items" CASCADE;
CREATE TABLE "public"."folder_items" (
    "folder_id" uuid NOT NULL REFERENCES "public"."folders"("id"),
    "puzzle_id" uuid NOT NULL REFERENCES "public"."player_puzzles"("id"),
    PRIMARY KEY ("folder_id", "puzzle_id")
);



