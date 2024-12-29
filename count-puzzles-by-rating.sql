SELECT rating, COUNT(*), SUM(num_attempts) as total_attempts, SUM(num_solves) as total_solves
FROM rated_puzzles
GROUP BY rating
ORDER BY rating ASC