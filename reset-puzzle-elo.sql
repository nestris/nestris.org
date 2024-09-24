-- Start a transaction
BEGIN;

-- Clear all puzzle attempts
TRUNCATE TABLE public.puzzle_attempts;

-- Reset num_solves_cached and num_attempts_cached for all puzzles
UPDATE public.rated_puzzles
SET num_solves_cached = 0,
    num_attempts_cached = 0;

-- Set puzzle_elo and highest_puzzle_elo to 0 for all users
UPDATE public.users
SET puzzle_elo = 0,
    highest_puzzle_elo = 0;

-- Commit the transaction
COMMIT;