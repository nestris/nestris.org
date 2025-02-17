-- DON't RUN THIS UNLESS YOU WANT TO WIPE THE DATABASE

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USER TABLE
-- highest accuracy stored as percentage * 100 (e.g. 99.5% is stored as 9950)
DROP TABLE IF EXISTS "public"."users" CASCADE;
CREATE TABLE "public"."users" (
    "userid" text NOT NULL,
    "username" text NOT NULL UNIQUE,
    "login_method" text NOT NULL,
    "authentication" text NOT NULL,
    "created_at" timestamp NOT NULL,
    "last_online" timestamp NOT NULL,
    "league" int2 NOT NULL,
    "xp" int4 NOT NULL,

    "matches_played" int4 NOT NULL,
    "wins" int4 NOT NULL,
    "losses" int4 NOT NULL,
    "trophies" int2 NOT NULL,
    "highest_trophies" int2 NOT NULL,
    
    "puzzle_elo" int2 NOT NULL,
    "highest_puzzle_elo" int2 NOT NULL,
    "puzzles_attempted" int4 NOT NULL,
    "puzzles_solved" int4 NOT NULL,
    "puzzle_seconds_played" int8 NOT NULL,
    
    "games_played" int4 NOT NULL,
    "highest_score" int4 NOT NULL,
    "highest_level" int2 NOT NULL,
    "highest_lines" int2 NOT NULL,

    "highest_transition_into_19" int4 NOT NULL,
    "highest_transition_into_29" int4 NOT NULL,

    "enable_receive_friend_requests" boolean NOT NULL,
    "notify_on_friend_online" boolean NOT NULL,
    "enable_runahead" boolean NOT NULL,
    "show_live_analysis" boolean NOT NULL,
    "disable_midgame_quests" boolean NOT NULL,

    "keybind_emu_move_left" text NOT NULL,
    "keybind_emu_move_right" text NOT NULL,
    "keybind_emu_rot_left" text NOT NULL,
    "keybind_emu_rot_right" text NOT NULL,
    "keybind_emu_up" text NOT NULL,
    "keybind_emu_down" text NOT NULL,
    "keybind_emu_start" text NOT NULL,
    "keybind_emu_reset" text NOT NULL,
    "keybind_puzzle_rot_left" text NOT NULL,
    "keybind_puzzle_rot_right" text NOT NULL,

    "quest_progress" int4[] NOT NULL DEFAULT '{}',

    PRIMARY KEY ("userid")
);

CREATE INDEX trophies_index ON users (trophies DESC);
CREATE INDEX puzzle_elo_index ON users (puzzle_elo DESC);
CREATE INDEX highest_score_index ON users (highest_score DESC);

-- Store brcypted password for password users
DROP TABLE IF EXISTS "public"."password_users" CASCADE;
CREATE TABLE "public"."password_users" (
    "userid" text NOT NULL REFERENCES "public"."users"("userid"),
    "password" text NOT NULL,
    PRIMARY KEY ("userid")
);

-- USER_RELATIONSHIPS table
DROP TABLE IF EXISTS "public"."friends" CASCADE;
CREATE TABLE "public"."friends" (
    "userid1" text NOT NULL REFERENCES "public"."users"("userid"),
    "userid2" text NOT NULL REFERENCES "public"."users"("userid"),
    PRIMARY KEY ("userid1","userid2")
);


-- GENERATED RATED PUZZLE TABLE
-- rating is between 1 and 6
-- [current|next|guesses]_N -> N is which solution ranking (1-5), current is current piece, next is next piece, guesses is num guesses to solution
DROP TABLE IF EXISTS "public"."rated_puzzles" CASCADE;
CREATE TABLE "public"."rated_puzzles" (
    "id" text NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    
    "current_1" int2 NOT NULL,
    "next_1" int2 NOT NULL,
    "score_1" text NOT NULL,
    "guesses_1" int2 NOT NULL DEFAULT 0,

    "current_2" int2 NOT NULL,
    "next_2" int2 NOT NULL,
    "score_2" text NOT NULL,
    "guesses_2" int2 NOT NULL DEFAULT 0,

    "current_3" int2 NOT NULL,
    "next_3" int2 NOT NULL,
    "score_3" text NOT NULL,
    "guesses_3" int2 NOT NULL DEFAULT 0,

    "current_4" int2 NOT NULL DEFAULT 0,
    "next_4" int2 NOT NULL,
    "score_4" text NOT NULL,
    "guesses_4" int2 NOT NULL DEFAULT 0,

    "current_5" int2 NOT NULL DEFAULT 0,
    "next_5" int2 NOT NULL,
    "score_5" text NOT NULL,
    "guesses_5" int2 NOT NULL DEFAULT 0,

    "rating" int2 NOT NULL CHECK (rating >= 1 AND rating <= 6),
    "theme" text NOT NULL,
    "num_attempts" int4 NOT NULL DEFAULT 0,
    "num_solves" int4 NOT NULL DEFAULT 0,
    "num_likes" int4 NOT NULL DEFAULT 0,
    "num_dislikes" int4 NOT NULL DEFAULT 0,

    PRIMARY KEY ("id")
);
CREATE INDEX rating_index ON rated_puzzles (rating DESC); -- for fetching puzzles by rating


-- GAME TABLE
-- accuracy and tetris rate is stored as percentage * 100 (e.g. 99.5% is stored as 9950)
-- data is the binary game data, which is nullable for when game expires
DROP TABLE IF EXISTS "public"."games" CASCADE;
CREATE TABLE "public"."games" (
    "id" text NOT NULL,
    "type" text NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "userid" text NOT NULL REFERENCES "public"."users"("userid"),
    "start_level" int2 NOT NULL,
    "end_score" int4 NOT NULL,
    "end_level" int2 NOT NULL,
    "end_lines" int2 NOT NULL,
    "accuracy" int2,
    "tetris_rate" int2 NOT NULL,
    "xp_gained" int4 NOT NULL,
    "average_eval_loss" real NOT NULL,
    "brilliant_count" int2 NOT NULL,
    "best_count" int2 NOT NULL,
    "excellent_count" int2 NOT NULL,
    "good_count" int2 NOT NULL,
    "inaccurate_count" int2 NOT NULL,
    "mistake_count" int2 NOT NULL,
    "blunder_count" int2 NOT NULL,
    PRIMARY KEY ("id")
);

-- index by end_score, created_at, accuracy
CREATE INDEX game_userid_index ON games (userid DESC);
CREATE INDEX end_score_index ON games (end_score DESC);
CREATE INDEX created_at_index ON games (created_at DESC);
CREATE INDEX accuracy_index ON games (accuracy DESC);

-- GAME DATA, storing the game data for each game
DROP TABLE IF EXISTS "public"."game_data" CASCADE;
CREATE TABLE "public"."game_data" (
    "game_id" text NOT NULL REFERENCES "public"."games"("id"),
    "data" bytea NOT NULL,
    PRIMARY KEY ("game_id")
);

-- HIGHSCORE GAME TABLE
-- stores the highscore for each game
DROP TABLE IF EXISTS "public"."highscore_games" CASCADE;
CREATE TABLE "public"."highscore_games" (
    "userid" text NOT NULL REFERENCES "public"."users"("userid"),
    "game_id" text NOT NULL REFERENCES "public"."games"("id"),
    PRIMARY KEY ("userid")
);


-- Table that maps global stat to value
DROP TABLE IF EXISTS "public"."global_stats" CASCADE;
CREATE TABLE "public"."global_stats" (
    "stat" text NOT NULL,
    "value" double precision NOT NULL,
    PRIMARY KEY ("stat")
);

-- ACTIVITIES TABLE
-- Stores the timestamped activities each user has done
DROP TABLE IF EXISTS "public"."activities" CASCADE;
CREATE TABLE "public"."activities" (
    "id" SERIAL PRIMARY KEY,
    "userid" text NOT NULL REFERENCES "public"."users"("userid"),
    "created_at" timestamp NOT NULL DEFAULT now(),
    "data" jsonb NOT NULL
);
CREATE INDEX activities_userid_index ON activities (userid DESC);

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