import { queryDB } from "../database";

export interface ActivePuzzle {
  userid: string;
  puzzleID: string;
  eloGain: number;
  eloLoss: number;
  startedAt: string;
}

// get the active puzzle for the userid, or undefined if there is no active puzzle
export async function getActivePuzzle(userid: string): Promise<ActivePuzzle | undefined> {
  
  const result = await queryDB("SELECT * FROM active_puzzles WHERE userid = $1", [userid]);
  if (result.rows.length === 0) {
    return undefined;
  }

  const row = result.rows[0];
  return {
    userid: row.userid,
    puzzleID: row.puzzle_id,
    eloGain: row.elo_gain,
    eloLoss: row.elo_loss,
    startedAt: row.started_at
  };
}

export async function hasActivePuzzle(userid: string): Promise<boolean> {
  return (await getActivePuzzle(userid)) !== undefined;
}

export async function setActivePuzzle(userid: string, puzzleID: string, eloGain: number, eloLoss: number) {
  await queryDB("INSERT INTO active_puzzles (userid, puzzle_id, elo_gain, elo_loss) VALUES ($1, $2, $3, $4)", [userid, puzzleID, eloGain, eloLoss]);
}

export async function clearActivePuzzle(userid: string) {
  await queryDB("DELETE FROM active_puzzles WHERE userid = $1", [userid]);
}