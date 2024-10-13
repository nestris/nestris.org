-- Clear active_puzzles table
DELETE FROM public.active_puzzles;

-- Clear puzzle_feedback table
DELETE FROM public.puzzle_feedback;

-- Set all puzzle_attempts puzzle_id to NULL
UPDATE public.puzzle_attempts
SET puzzle_id = NULL;

-- Clear rated_puzzles table
CREATE OR REPLACE FUNCTION delete_all_rows_in_batches(
    table_name text,
    batch_size integer DEFAULT 1000
)
RETURNS void AS $$
DECLARE
    deleted_count integer;
    total_deleted integer := 0;
BEGIN
    LOOP
        EXECUTE format('
            DELETE FROM %I
            WHERE ctid IN (
                SELECT ctid
                FROM %I
                ORDER BY ctid
                LIMIT %L
            )
        ', table_name, table_name, batch_size);

        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
        
        RAISE NOTICE 'Deleted % rows. Total rows deleted: %', deleted_count, total_deleted;
        
        EXIT WHEN deleted_count = 0;
        
        -- Optional: Add a small delay to reduce database load
        PERFORM pg_sleep(1);
    END LOOP;

    RAISE NOTICE 'Deletion complete. Total rows deleted: %', total_deleted;
END;
$$ LANGUAGE plpgsql;

SELECT delete_all_rows_in_batches('rated_puzzles');