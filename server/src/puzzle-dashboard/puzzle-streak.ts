
// returns the number of solved puzzles for a user for each of the last 7 days
// use local timezone parameter to determine the start and end of each day
// ordered from least recent to most recent

import { DailyStreak } from "../../shared/puzzles/daily-streak";
import { queryDB } from "../database-old";
import { Request, Response } from "express";


// do this in a single query
export async function getDailyStreak(userid: string, timezone: string): Promise<DailyStreak> 
  {

  // query that gets the number of solved puzzles for a user for each of the last 7 days
  // it also returns the number of days from the current day for each row
  const query = `
    SELECT COUNT(*) as count, DATE_TRUNC('day', NOW() AT TIME ZONE $2) - DATE_TRUNC('day', timestamp AT TIME ZONE $2) as days_ago
    FROM puzzle_attempts
    WHERE userid = $1
    AND is_correct = TRUE
    AND timestamp >= (DATE_TRUNC('day', NOW() AT TIME ZONE $2) - INTERVAL '7 days')
    GROUP BY DATE_TRUNC('day', timestamp AT TIME ZONE $2)
    ORDER BY DATE_TRUNC('day', timestamp AT TIME ZONE $2) DESC
    LIMIT 7
  `;

  const result = await queryDB(query, [userid, timezone]);
  console.log(result.rows);
  const correctPuzzleCountRaw: number[] = result.rows.map((row: any) => row.count);
  const daysAgo: number[] = result.rows.map((row: any) => (row.days_ago["days"] ?? 0) + 1);

  console.log("Correct puzzle count raw: ", correctPuzzleCountRaw);
  console.log("Days ago: ", daysAgo);

  // fill in the correct puzzle count for each of the last 7 days
  const correctPuzzleCount = [0, 0, 0, 0, 0, 0, 0];
  daysAgo.forEach((daysAgo, index) => {
    correctPuzzleCount[daysAgo] = correctPuzzleCountRaw[index];
  });

  // get the names of the weekdays for the last 7 days using the timezone
  const weekdays = correctPuzzleCount.map((_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - index);
    return day.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
  });

  return correctPuzzleCount.map((count, index) => {
    return {
      count: count,
      weekday: weekdays[index]
    };
  }).reverse();
}

export async function getDailyStreakRoute(req: Request, res: Response) {
  const userid = req.params['userid'] as string;
  const timezone = req.query['timezone'] as string;

  try {
    const streak = await getDailyStreak(userid, decodeURIComponent(timezone));
    res.status(200).send(streak);
  } catch (error) {
    res.status(404).send(error);
  }
}