SELECT 
    rp.rating,
    COUNT(DISTINCT rp.id) FILTER (WHERE pa.puzzle_id IS NULL) AS not_attempted,
    COUNT(DISTINCT rp.id) FILTER (WHERE pa.puzzle_id IS NOT NULL) AS attempted
FROM 
    rated_puzzles rp
LEFT JOIN 
    (SELECT DISTINCT puzzle_id FROM puzzle_attempts WHERE username = 'test') pa
    ON rp.id = pa.puzzle_id
GROUP BY 
    rp.rating
ORDER BY 
    rp.rating;
