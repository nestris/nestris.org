export type Leaderboard = ({
  rank: number; // player's global puzzle elo ranking, 1-indexed
  username: string; // player's username
  elo: number; // player's global puzzle elo
} | null)[];

export interface PuzzleRank {
  rank: number; // player's global puzzle elo ranking, 1-indexed
  leaderboard: Leaderboard; // the 5 players surrounding the player in the global puzzle elo leaderboard, where the player is in the middle
}