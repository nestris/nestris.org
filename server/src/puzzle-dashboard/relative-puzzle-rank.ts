import { PuzzleRank, Leaderboard } from "../../shared/puzzles/puzzle-rank";
import { queryDB } from "../database";
import { Request, Response } from "express";


// get the player's global puzzle elo ranking and the 5 players surrounding the player in the global puzzle elo leaderboard
export async function getRelativePuzzleRank(userid: string): Promise<PuzzleRank> {

  // make a SQL query to get the player's global puzzle elo ranking
  const query = `
    SELECT userid, username, puzzle_elo
    FROM users
    ORDER BY puzzle_elo DESC
  `;
  const result = await queryDB(query, []);

  // console.log(result.rows);

  // find the player's global puzzle elo ranking
  let playerRank = 0;
  for (let i = 0; i < result.rows.length; i++) {
    if (result.rows[i].userid === userid) {
      playerRank = i + 1;
      break;
    }
  }

  // get the 5 players surrounding the player in the global puzzle elo leaderboard
  // if there is not a player in the leaderboard at a certain position, set to undefined
  const leaderboard: Leaderboard = [];
  for (let i = playerRank - 2; i <= playerRank + 2; i++) {
    if (i >= 1 && i <= result.rows.length) {
      leaderboard.push({
        rank: i,
        username: result.rows[i - 1].username,
        elo: result.rows[i - 1].puzzle_elo
      });
    } else {
      leaderboard.push(null);
    }
  };

  // console.log("Leaderboard: ", leaderboard);

  return {
    rank: playerRank,
    leaderboard: leaderboard
  };
}

export async function getRelativePuzzleRankRoute(req: Request, res: Response) {
  const userid = req.params['userid'] as string;

  try {
    const rank = await getRelativePuzzleRank(userid);
    res.status(200).send(rank);
  } catch (error) {
    res.status(404).send(error);
  }
}