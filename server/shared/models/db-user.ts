export enum PermissionLevel {
  ADMIN = "admin", // full unrestricted access
  TRUSTED = "trusted",
  DEFAULT = "default",
}

// MAKE SURE THIS IS 1:1 WITH THE DATABASE TABLE
export interface DBUser {
  userid: string;
  username: string;
  permission: PermissionLevel;
  lastOnline: Date;
  trophies: number;
  xp: number;
  puzzleElo: number;
  highestPuzzleElo: number;
}