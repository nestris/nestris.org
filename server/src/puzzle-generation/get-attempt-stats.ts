import { queryDB } from "../database";
import { DateTime, IANAZone } from 'luxon';
import { Request, Response } from 'express';
import { AttemptStats, AttemptStatsForRating, TimePeriod } from "../../shared/puzzles/attempt-stats";
import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";


export async function getAttemptStats(userid: string, period: TimePeriod, timezone: string): Promise<AttemptStats> {
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
                rating,
                COUNT(*) FILTER (WHERE pa.is_correct = true) AS num_solved,
                COUNT(*) AS num_attempted,
                AVG(pa.solve_time) AS avg_solve_time
            FROM puzzle_attempts pa
            WHERE pa.userid = $1 AND pa.timestamp >= $2
            GROUP BY rating
        )
        SELECT
            rating,
            num_solved,
            num_attempted,
            avg_solve_time
        FROM filtered_attempts
        ORDER BY rating;`,
        [userid, periodStart.toISO()]
    );


    let totalAttempts = 0;
    let totalSolved = 0;
    let totalSolveTime = 0;

    const attemptStatsForRating: {[key in PuzzleRating]?: AttemptStatsForRating} = {};

    console.log(result.rows);

    result.rows.forEach(row => {
      const rating = row.rating as PuzzleRating;
      const numSolved = parseInt(row.num_solved);
      const numAttempted = parseInt(row.num_attempted);
      const avgSolveTime = parseFloat(row.avg_solve_time);

      if (rating !== PuzzleRating.SIX_STAR || numAttempted > 0) {
        attemptStatsForRating[rating] = {
          rating,
          attempts: numAttempted,
          successRate: numSolved / numAttempted
        }
      }

      totalAttempts += numAttempted;
      totalSolved += numSolved;
      totalSolveTime += avgSolveTime * numAttempted;
    });


    return {
      puzzlesAttempted: totalAttempts,
      puzzlesSolved: totalSolved,
      averageSolveDuration: totalAttempts === 0 ? 0 : totalSolveTime / totalAttempts,
      attemptStatsForRating,
    }
}

export async function getAttemptStatsRoute(req: Request, res: Response) {
    const userid = req.params['userid'] as string;
    const period = req.query['period'] as TimePeriod;
    const timezone = req.query['timezone'] as string;

    try {
      const stats = await getAttemptStats(userid, period, timezone);
      res.send(stats);
    } catch (error) {
      console.log(error);
      res.status(404).send(error);
  }
}