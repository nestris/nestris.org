export enum Authentication {
  ADMIN = "admin", // full unrestricted access
  TRUSTED = "trusted",
  USER = "default",
  NONE = "none",
}

export const AUTHENTICATION_LEVEL = {
  [Authentication.ADMIN]: 3,
  [Authentication.TRUSTED]: 2,
  [Authentication.USER]: 1,
  [Authentication.NONE]: 0,
}

// MAKE SURE THIS IS 1:1 WITH THE DATABASE TABLE
export interface DBUser {
  userid: string;
  username: string;
  authentication: Authentication;
  lastOnline: Date;
  trophies: number;
  xp: number;
  puzzleElo: number;
  highestPuzzleElo: number;
}