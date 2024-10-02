-- Clear active_puzzles table
DELETE FROM public.active_puzzles;

-- Clear puzzle_feedback table
DELETE FROM public.puzzle_feedback;

-- Set all puzzle_attempts puzzle_id to NULL
UPDATE public.puzzle_attempts
SET puzzle_id = NULL;

-- Clear rated_puzzles table
DELETE FROM public.rated_puzzles;