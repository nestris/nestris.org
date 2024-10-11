WITH player_stats AS (
  SELECT 
    u.username,
    COUNT(pa.id) AS total_6star_attempts,
    SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) AS total_6star_solves
  FROM 
    users u
    INNER JOIN puzzle_attempts pa ON u.userid = pa.userid
    INNER JOIN rated_puzzles rp ON pa.puzzle_id = rp.id
  WHERE 
    pa.rating = 6
  GROUP BY 
    u.userid, u.username
  HAVING 
    COUNT(pa.id) > 0
)
SELECT 
  username,
  total_6star_attempts AS num_6star_attempts,
  total_6star_solves AS num_6star_solves,
  ROUND((total_6star_solves::numeric / total_6star_attempts::numeric) * 100, 2) AS solve_rate_percentage
FROM 
  player_stats
ORDER BY 
  total_6star_attempts DESC, solve_rate_percentage DESC;