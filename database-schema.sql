-- USER TABLE
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
    "username" text NOT NULL,
    "lastOnline" timestamp NOT NULL DEFAULT now(),
    "trophies" int2 NOT NULL DEFAULT 1000,
    "xp" int2 NOT NULL DEFAULT 0,
    "puzzleElo" int2 NOT NULL DEFAULT 1000,
    PRIMARY KEY ("username")
);

-- USER_RELATIONSHIPS table
DROP TABLE IF EXISTS "public"."user_relationships";
CREATE TABLE "public"."user_relationships" (
    "username1" text NOT NULL REFERENCES "public"."users"("username"),
    "username2" text NOT NULL REFERENCES "public"."users"("username"),
    "type" text CHECK (type = ANY (ARRAY['1_send_to_2'::text, '2_send_to_1'::text, 'friends'::text])),
    PRIMARY KEY ("username1","username2")
);

-- PUZZLE TABLE
DROP TABLE IF EXISTS "public"."puzzles";
CREATE TABLE "public"."puzzles" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "creator" text REFERENCES "public"."users"("username"), -- if NULL, then it is a system-generated puzzle

    "board" bytea NOT NULL,
    "currentPiece" char(1) NOT NULL,
    "nextPiece" char(1) NOT NULL,
    
    "r1" int2 NOT NULL,
    "x1" int2 NOT NULL,
    "y1" int2 NOT NULL,
    "r2" int2 NOT NULL,
    "x2" int2 NOT NULL,
    "y2" int2 NOT NULL,

    "elo" int2 NOT NULL,
    "numReports" int2 NOT NULL DEFAULT 0,
    "numAttemptsCached" int2 NOT NULL DEFAULT 0, -- should be updated by trigger on PuzzleAttempt
    "numSolvesCached" int2 NOT NULL DEFAULT 0, -- should be updated by trigger on PuzzleAttempt

    PRIMARY KEY ("id")
);

-- PUZZLE_ATTEMPT TABLE
DROP TABLE IF EXISTS "public"."puzzle_attempts";
CREATE TABLE "public"."puzzle_attempts" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "puzzleID" uuid NOT NULL REFERENCES "public"."puzzles"("id"),
    "username" text NOT NULL REFERENCES "public"."users"("username"),
    "timestamp" timestamp NOT NULL DEFAULT now(),

    "isCorrect" boolean NOT NULL,
    "eloChange" int2, -- if NULL, then it was an unranked puzzle
    "solveTime" int2 NOT NULL,

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
    UPDATE puzzles
    SET numAttemptsCached = (SELECT COUNT(*) FROM puzzle_attempts WHERE puzzleID = NEW.puzzleID),
        numSolvesCached = (SELECT COUNT(*) FROM puzzle_attempts WHERE puzzleID = NEW.puzzleID AND isCorrect = TRUE)
    WHERE id = NEW.puzzleID;
    RETURN NEW;
END;

-- trigger to update the number of attempts and solves for a puzzle
DROP TRIGGER IF EXISTS update_puzzle_cached_data_trigger ON puzzle_attempts;
CREATE TRIGGER update_puzzle_cached_data_trigger
AFTER INSERT OR UPDATE OR DELETE ON puzzle_attempts
FOR EACH ROW EXECUTE FUNCTION update_puzzle_cached_data();

-- FOLDER TABLE
DROP TABLE IF EXISTS "public"."folders";
CREATE TABLE "public"."folders" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "username" text NOT NULL REFERENCES "public"."users"("username"),
    "name" text NOT NULL,
    PRIMARY KEY ("id")
);

-- FOLDER_ITEM TABLE
DROP TABLE IF EXISTS "public"."folder_items";
CREATE TABLE "public"."folder_items" (
    "folderID" uuid NOT NULL REFERENCES "public"."folders"("id"),
    "puzzleID" uuid NOT NULL REFERENCES "public"."puzzles"("id"),
    PRIMARY KEY ("folderID", "puzzleID")
);


-- populate the database with some test data
INSERT INTO "public"."user_relationships" ("username1", "username2", "type") VALUES
('a', 'b', 'friends'),
('a', 'c', 'friends'),
('a', 'd', 'friends');

INSERT INTO "public"."users" ("username", "lastOnline", "trophies", "xp", "puzzleElo") VALUES
('a', '2024-03-03 23:32:23.269187', 1234, 12345, 1000),
('b', '2024-03-03 23:32:23.269187', 2345, 23456, 1000),
('c', '2024-03-04 00:13:02.575837', 3456, 0, 1000),
('d', '2024-03-04 00:13:09.44237', 4567, 0, 1000),
('test', '2024-03-22 02:25:14.417473', 1000, 0, 1000);

