import { queryDB } from "../database";

export interface ActivePuzzle {
  username: string;
  puzzleID: string;
  eloGain: number;
  eloLoss: number;
  startedAt: string;
}

// get the active puzzle for the username, or undefined if there is no active puzzle
export async function getActivePuzzle(username: string): Promise<ActivePuzzle | undefined> {
  
  const result = await queryDB("SELECT * FROM active_puzzles WHERE username = $1", [username]);
  if (result.rows.length === 0) {
    return undefined;
  }

  const row = result.rows[0];
  return {
    username: row.username,
    puzzleID: row.puzzle_id,
    eloGain: row.elo_gain,
    eloLoss: row.elo_loss,
    startedAt: row.started_at
  };
}

export async function hasActivePuzzle(username: string): Promise<boolean> {
  return (await getActivePuzzle(username)) !== undefined;
}

export async function setActivePuzzle(username: string, puzzleID: string, eloGain: number, eloLoss: number) {
  await queryDB("INSERT INTO active_puzzles (username, puzzle_id, elo_gain, elo_loss) VALUES ($1, $2, $3, $4)", [username, puzzleID, eloGain, eloLoss]);
}

export async function clearActivePuzzle(username: string) {
  await queryDB("DELETE FROM active_puzzles WHERE username = $1", [username]);
}