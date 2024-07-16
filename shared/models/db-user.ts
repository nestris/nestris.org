// MAKE SURE THIS IS 1:1 WITH THE DATABASE TABLE
export interface DBUser {
  username: string;
  lastOnline: Date;
  trophies: number;
  xp: number;
  puzzleElo: number;
  highestPuzzleElo: number;
}