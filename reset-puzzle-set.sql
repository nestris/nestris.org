-- Clear active_puzzles table
DELETE FROM public.active_puzzles;

-- Clear puzzle_feedback table
DELETE FROM public.puzzle_feedback;

-- Set all puzzle_attempts puzzle_id to NULL
UPDATE public.puzzle_attempts
SET puzzle_id = NULL;


-- Reset rated_puzzles table
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