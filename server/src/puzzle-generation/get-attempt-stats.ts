import { queryDB } from "../database";
import { DateTime, IANAZone } from 'luxon';
import { Request, Response } from 'express';
import { AttemptStats, TimePeriod } from "../../shared/puzzles/attempt-stats";
import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";


export async function getAttemptStats(username: string, period: TimePeriod, timezone: string): Promise<AttemptStats> {
    const zone = IANAZone.create(timezone);
    const now = DateTime.now().setZone(zone);

    let periodStart: DateTime;

    switch (period) {
        case TimePeriod.LIFETIME:
            periodStart = DateTime.fromMillis(0, { zone }); // Epoch
            break;
        case TimePeriod.THIS_WEEK:
            periodStart = now.startOf('week');
            break;
        case TimePeriod.TODAY:
            periodStart = now.startOf('day');
            break;
        default:
            throw new Error("Unsupported time period.");
    }

    const result = await queryDB(
        `WITH filtered_attempts AS (
            SELECT
                p.rating,
                COUNT(*) FILTER (WHERE pa.is_correct = true) AS num_solved,
                COUNT(*) AS num_attempted,
                AVG(pa.solve_time) AS avg_solve_time
            FROM puzzle_attempts pa
            JOIN rated_puzzles p ON pa.puzzle_id = p.id
            WHERE pa.username = $1 AND pa.timestamp >= $2
            GROUP BY p.rating
        )
        SELECT
            rating,
            num_solved,
            num_attempted,
            avg_solve_time
        FROM filtered_attempts
        ORDER BY rating;`,
        [username, periodStart.toISO()]
    );


    let totalAttempts = 0;
    let totalSolved = 0;
    let totalSolveTime = 0;

    const successRateForRating: {[key in PuzzleRating]?: number | null} = {
      [PuzzleRating.ONE_STAR]: null,
      [PuzzleRating.TWO_STAR]: null,
      [PuzzleRating.THREE_STAR]: null,
      [PuzzleRating.FOUR_STAR]: null,
      [PuzzleRating.FIVE_STAR]: null,
    };

    console.log(result.rows);

    result.rows.forEach(row => {
      const rating = row.rating as PuzzleRating;
      const numSolved = parseInt(row.num_solved);
      const numAttempted = parseInt(row.num_attempted);
      const avgSolveTime = parseFloat(row.avg_solve_time);

      successRateForRating[rating] = numAttempted === 0 ? 0 : numSolved / numAttempted;

      totalAttempts += numAttempted;
      totalSolved += numSolved;
      totalSolveTime += avgSolveTime * numAttempted;
    });

    return {
      puzzlesAttempted: totalAttempts,
      puzzlesSolved: totalSolved,
      averageSolveDuration: totalAttempts === 0 ? 0 : totalSolveTime / totalAttempts,
      successRateForRating,
    }
}

export async function getAttemptStatsRoute(req: Request, res: Response) {
    const username = req.params['username'] as string;
    const period = req.query['period'] as TimePeriod;
    const timezone = req.query['timezone'] as string;

    try {
      const stats = await getAttemptStats(username, period, timezone);
      res.send(stats);
    } catch (error) {
      console.log(error);
      res.status(404).send(error);
  }
}