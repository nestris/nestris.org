-- DON't RUN THIS UNLESS YOU WANT TO WIPE THE DATABASE

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USER TABLE
DROP TABLE IF EXISTS "public"."users" CASCADE;
CREATE TABLE "public"."users" (
    "userid" text NOT NULL,
    "username" text NOT NULL UNIQUE,
    "permission" text NOT NULL DEFAULT 'default'::text,
    "last_online" timestamp NOT NULL DEFAULT now(),
    "trophies" int2 NOT NULL DEFAULT 1000,
    "xp" int2 NOT NULL DEFAULT 0,
    "puzzle_elo" int2 NOT NULL DEFAULT 0,
    "highest_puzzle_elo" int2 NOT NULL DEFAULT 0,
    PRIMARY KEY ("userid")
);

CREATE INDEX puzzle_elo_index ON users (puzzle_elo DESC); -- for leaderboard

-- maintain the highest puzzle elo
CREATE OR REPLACE FUNCTION update_highest_puzzle_elo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.puzzle_elo > NEW.highest_puzzle_elo THEN
        NEW.highest_puzzle_elo = NEW.puzzle_elo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger to update the highest puzzle elo when the puzzle elo is updated for a user
DROP TRIGGER IF EXISTS update_highest_puzzle_elo_trigger ON users;
CREATE TRIGGER update_highest_puzzle_elo_trigger
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_highest_puzzle_elo();


-- USER_WHITELIST table
DROP TABLE IF EXISTS "public"."whitelist" CASCADE;
CREATE TABLE "public"."whitelist" (
    "discord_tag" text NOT NULL,
    "permission" text NOT NULL DEFAULT 'default'::text, 
    PRIMARY KEY ("discord_tag")
);


-- hardcode some users to whitelisted
INSERT INTO whitelist (discord_tag, permission) VALUES ('anselchang', 'admin');


-- USER_RELATIONSHIPS table
DROP TABLE IF EXISTS "public"."user_relationships" CASCADE;
CREATE TABLE "public"."user_relationships" (
    "userid1" text NOT NULL REFERENCES "public"."users"("userid"),
    "userid2" text NOT NULL REFERENCES "public"."users"("userid"),
    "type" text CHECK (type = ANY (ARRAY['1_send_to_2'::text, '2_send_to_1'::text, 'friends'::text])),
    PRIMARY KEY ("userid1","userid2")
);


-- GENERATED RATED PUZZLE TABLE
-- rating is between 1 and 5
DROP TABLE IF EXISTS "public"."rated_puzzles" CASCADE;
CREATE TABLE "public"."rated_puzzles" (
    "id" text NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),

    "current_piece" char(1) NOT NULL,
    "next_piece" char(1) NOT NULL,
    
    "current_placement" int2 NOT NULL,
    "next_placement" int2 NOT NULL,

    "rating" int2 NOT NULL CHECK (rating >= 1 AND rating <= 6),
    "theme" text NOT NULL,
    "state" text NOT NULL DEFAULT 'provisional'::text,
    "num_attempts_cached" int2 NOT NULL DEFAULT 0, -- should be updated by trigger on PuzzleAttempt
    "num_solves_cached" int2 NOT NULL DEFAULT 0, -- should be updated by trigger on PuzzleAttempt
    "num_likes_cached" int2 NOT NULL DEFAULT 0,
    "num_dislikes_cached" int2 NOT NULL DEFAULT 0,

    PRIMARY KEY ("id")
);
CREATE INDEX rating_index ON rated_puzzles (rating DESC); -- for fetching puzzles to rate

-- whether user liked/disliked a puzzle
--feedback text can only be "liked", "disliked", or "none"
DROP TABLE IF EXISTS "public"."puzzle_feedback" CASCADE;
CREATE TABLE "public"."puzzle_feedback" (
    "puzzle_id" text NOT NULL REFERENCES "public"."rated_puzzles"("id"),
    "userid" text NOT NULL REFERENCES "public"."users"("userid"),
    "feedback" text NOT NULL CHECK (feedback = ANY (ARRAY['liked'::text, 'disliked'::text, 'none'::text])) DEFAULT 'none'::text,
    PRIMARY KEY ("puzzle_id", "userid")
);

-- calculate the number of likes and dislikes for a puzzle
-- do not solve dynamically
CREATE OR REPLACE FUNCTION update_puzzle_feedback_cached_data()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rated_puzzles
    SET num_likes_cached = (SELECT COUNT(*) FROM puzzle_feedback WHERE puzzle_id = NEW.puzzle_id AND feedback = 'liked'::text),
        num_dislikes_cached = (SELECT COUNT(*) FROM puzzle_feedback WHERE puzzle_id = NEW.puzzle_id AND feedback = 'disliked'::text)
    WHERE id = NEW.puzzle_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger to update the number of likes and dislikes for a puzzle
DROP TRIGGER IF EXISTS update_puzzle_feedback_cached_data_trigger ON puzzle_feedback;
CREATE TRIGGER update_puzzle_feedback_cached_data_trigger
AFTER INSERT OR UPDATE OR DELETE ON puzzle_feedback
FOR EACH ROW EXECUTE FUNCTION update_puzzle_feedback_cached_data();


-- PUZZLE_ATTEMPT TABLE (for rated puzzles only)

DROP TABLE IF EXISTS "public"."puzzle_attempts" CASCADE;
CREATE TABLE "public"."puzzle_attempts" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "puzzle_id" text REFERENCES "public"."rated_puzzles"("id"),
    "userid" text NOT NULL REFERENCES "public"."users"("userid"),
    "timestamp" timestamp NOT NULL DEFAULT now(),
    "rating" int2 NOT NULL CHECK (rating >= 1 AND rating <= 6),
    "is_correct" boolean NOT NULL,
    "elo_before" int2 NOT NULL,
    "elo_change" int2, -- if NULL, then it was an unranked puzzle
    "solve_time" int2 NOT NULL,

    "current_placement" int2,
    "next_placement" int2,

    PRIMARY KEY ("id")
);
CREATE INDEX timestamp_index ON puzzle_attempts (timestamp DESC); -- for fetching recent puzzle attempts


-- calculate the number of attempts and solves for a puzzle
-- do not solve dynamically
CREATE OR REPLACE FUNCTION update_puzzle_cached_data()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rated_puzzles
    SET num_attempts_cached = (SELECT COUNT(*) FROM puzzle_attempts WHERE puzzle_id = NEW.puzzle_id),
        num_solves_cached = (SELECT COUNT(*) FROM puzzle_attempts WHERE puzzle_id = NEW.puzzle_id AND is_correct = TRUE)
    WHERE id = NEW.puzzle_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger to update the number of attempts and solves for a puzzle
DROP TRIGGER IF EXISTS update_puzzle_cached_data_trigger ON puzzle_attempts;
CREATE TRIGGER update_puzzle_cached_data_trigger
AFTER INSERT OR UPDATE OR DELETE ON puzzle_attempts
FOR EACH ROW EXECUTE FUNCTION update_puzzle_cached_data();



-- GAME TABLE
DROP TABLE IF EXISTS "public"."games" CASCADE;
CREATE TABLE "public"."games" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" timestamp NOT NULL DEFAULT now(),
    "userid" text NOT NULL REFERENCES "public"."users"("userid"),
    PRIMARY KEY ("id")
);

-- GAME ANALYSIS TABLE
-- analysis of a game
DROP TABLE IF EXISTS "public"."game_analysis" CASCADE;
CREATE TABLE "public"."game_analysis" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "game_id" uuid NOT NULL REFERENCES "public"."games"("id"),
    PRIMARY KEY ("id")
);
CREATE INDEX game_id_index ON game_analysis (game_id); -- for fetching game analysis by game id

-- MATCH TABLE
-- match between two users
DROP TABLE IF EXISTS "public"."matches" CASCADE;
CREATE TABLE "public"."matches" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" timestamp NOT NULL DEFAULT now(),
    "userid1" text NOT NULL REFERENCES "public"."users"("userid"),
    "userid2" text NOT NULL REFERENCES "public"."users"("userid"),
    "rated" boolean NOT NULL,
    PRIMARY KEY ("id")
);

-- Table relating a game to a match. 1-to-1 relationship
DROP TABLE IF EXISTS "public"."match_games" CASCADE;
CREATE TABLE "public"."match_games" (
    "match_id" uuid NOT NULL REFERENCES "public"."matches"("id"),
    "game_id" uuid NOT NULL REFERENCES "public"."games"("id"),
    PRIMARY KEY ("match_id", "game_id")
);


-- LOG table that logs message with timestamp
DROP TABLE IF EXISTS "public"."logs" CASCADE;
CREATE TABLE "public"."logs" (
    "timestamp" timestamp NOT NULL DEFAULT now(),
    "userid" text REFERENCES "public"."users"("userid"),
    "message" text NOT NULL
);

-- EVENT table for website analytics
-- userid can be null if user is not logged in
DROP TABLE IF EXISTS "public"."events" CASCADE;
CREATE TABLE "public"."events" (
    "timestamp" timestamp NOT NULL DEFAULT now(),
    "userid" text REFERENCES "public"."users"("userid"),
    "sessionid" text,
    "event" text NOT NULL
);
CREATE INDEX timestamp_index ON events (timestamp DESC); -- for fetching recent events
CREATE INDEX sessionid_index ON events (sessionid); -- for fetching events by session id
CREATE INDEX event_index ON events (event); -- for fetching events by event type
CREATE INDEX userid_index ON events (userid); -- for fetching events by user id