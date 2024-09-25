SELECT 
    rating,
    COUNT(*) as puzzle_count
FROM 
    public.rated_puzzles
GROUP BY 
    rating
ORDER BY 
    rating ASC;