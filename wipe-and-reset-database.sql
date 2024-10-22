-- DON't RUN THIS UNLESS YOU WANT TO WIPE THE DATABASE

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USER TABLE
-- highest accuracy stored as percentage * 100 (e.g. 99.5% is stored as 9950)
DROP TABLE IF EXISTS "public"."users" CASCADE;
CREATE TABLE "public"."users" (
    "userid" text NOT NULL,
    "username" text NOT NULL UNIQUE,
    "authentication" text NOT NULL DEFAULT 'user'::text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "last_online" timestamp NOT NULL DEFAULT now(),
    "league" int2 NOT NULL DEFAULT 0,
    "xp" int2 NOT NULL DEFAULT 0,

    "trophies" int2 NOT NULL DEFAULT 0,
    "highest_trophies" int2 NOT NULL DEFAULT 0,
    
    "puzzle_elo" int2 NOT NULL DEFAULT 0,
    "highest_puzzle_elo" int2 NOT NULL DEFAULT 0,

    "highest_score" int2 NOT NULL DEFAULT 0,
    "highest_level" int2 NOT NULL DEFAULT 0,
    "highest_lines" int2 NOT NULL DEFAULT 0,
    "highest_accuracy" int2 NOT NULL DEFAULT 0,

    "highest_transition_into_19" int2 NOT NULL DEFAULT 0,
    "highest_transition_into_29" int2 NOT NULL DEFAULT 0,

    "has_perfect_transition_into_19" boolean NOT NULL DEFAULT FALSE,
    "has_perfect_transition_into_29" boolean NOT NULL DEFAULT FALSE,

    PRIMARY KEY ("userid")
);

CREATE INDEX trophies_index ON users (trophies DESC);
CREATE INDEX puzzle_elo_index ON users (puzzle_elo DESC);
CREATE INDEX highest_score_index ON users (highest_score DESC);
CREATE INDEX highest_accuracy_index ON users (highest_accuracy DESC);

-- maintain the highest trophies
CREATE OR REPLACE FUNCTION update_highest_trophies()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trophies > NEW.highest_trophies THEN
        NEW.highest_trophies = NEW.trophies;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger to update the highest trophies when the trophies are updated for a user
DROP TRIGGER IF EXISTS update_highest_trophies_trigger ON users;
CREATE TRIGGER update_highest_trophies_trigger
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_highest_trophies();

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


-- USER_RELATIONSHIPS table
DROP TABLE IF EXISTS "public"."user_relationships" CASCADE;
CREATE TABLE "public"."user_relationships" (
    "userid1" text NOT NULL REFERENCES "public"."users"("userid"),
    "userid2" text NOT NULL REFERENCES "public"."users"("userid"),
    "type" text CHECK (type = ANY (ARRAY['1_send_to_2'::text, '2_send_to_1'::text, 'friends'::text])),
    PRIMARY KEY ("userid1","userid2")
);


-- GENERATED RATED PUZZLE TABLE
-- rating is between 1 and t
-- [current|next|guesses]_N -> N is which solution ranking (1-5), current is current piece, next is next piece, guesses is num guesses to solution
DROP TABLE IF EXISTS "public"."rated_puzzles" CASCADE;
CREATE TABLE "public"."rated_puzzles" (
    "id" text NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),

    "current_piece" char(1) NOT NULL,
    "next_piece" char(1) NOT NULL,
    
    "current_1" int2 NOT NULL,
    "next_1" int2 NOT NULL,
    "guesses_1" int2 NOT NULL,

    "current_2" int2 NOT NULL,
    "next_2" int2 NOT NULL,
    "guesses_2" int2 NOT NULL,

    "current_3" int2 NOT NULL,
    "next_3" int2 NOT NULL,
    "guesses_3" int2 NOT NULL,

    "current_4" int2 NOT NULL,
    "next_4" int2 NOT NULL,
    "guesses_4" int2 NOT NULL,

    "current_5" int2 NOT NULL,
    "next_5" int2 NOT NULL,
    "guesses_5" int2 NOT NULL,

    "rating" int2 NOT NULL CHECK (rating >= 1 AND rating <= 6),
    "theme" text NOT NULL,
    "num_attempts" int2 NOT NULL DEFAULT 0,
    "num_solves" int2 NOT NULL DEFAULT 0,
    "num_likes" int2 NOT NULL DEFAULT 0,
    "num_dislikes" int2 NOT NULL DEFAULT 0,

    PRIMARY KEY ("id")
);
CREATE INDEX rating_index ON rated_puzzles (rating DESC); -- for fetching puzzles by rating


-- GAME TABLE
-- accuracy is stored as percentage * 100 (e.g. 99.5% is stored as 9950)
-- data is the binary game data, which is nullable for when game expires
DROP TABLE IF EXISTS "public"."games" CASCADE;
CREATE TABLE "public"."games" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" timestamp NOT NULL DEFAULT now(),
    "userid" text NOT NULL REFERENCES "public"."users"("userid"),
    "start_level" int2 NOT NULL,
    "end_score" int2 NOT NULL,
    "end_level" int2 NOT NULL,
    "end_lines" int2 NOT NULL,
    "accuracy" int2 NOT NULL,
    PRIMARY KEY ("id")
);

-- GAME DATA, storing the game data for each game
DROP TABLE IF EXISTS "public"."game_data" CASCADE;
CREATE TABLE "public"."game_data" (
    "game_id" uuid NOT NULL REFERENCES "public"."games"("id"),
    "data" bytea NOT NULL,
    PRIMARY KEY ("game_id")
);

-- MATCH TABLE
-- match between two users
DROP TABLE IF EXISTS "public"."matches" CASCADE;
CREATE TABLE "public"."matches" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" timestamp NOT NULL DEFAULT now(),
    "userid1" text NOT NULL REFERENCES "public"."users"("userid"),
    "userid2" text NOT NULL REFERENCES "public"."users"("userid"),
    "userid1_trophies" int2 NOT NULL,
    "userid2_trophies" int2 NOT NULL,
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
    "event" text NOT NULL,
    "json" jsonb DEFAULT NULL
);
CREATE INDEX timestamp_index ON events (timestamp DESC); -- for fetching recent events
CREATE INDEX sessionid_index ON events (sessionid); -- for fetching events by session id
CREATE INDEX event_index ON events (event); -- for fetching events by event type
CREATE INDEX userid_index ON events (userid); -- for fetching events by user id