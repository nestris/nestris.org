export enum GlobalStat {
    TOTAL_USER_COUNT = 'total_user_count',
    TOTAL_GAMES_PLAYED = 'total_games_played',
    TOTAL_PUZZLES_SOLVED = 'total_puzzles_solved',
    TOTAL_PUZZLE_HOURS = 'total_puzzle_hours',

    TOTAL_PIECES_PLACED = 'total_pieces_placed',
    TOTAL_MATCHES_PLAYED = 'total_matches_played',
    TOTAL_MATCH_HOURS = 'total_match_hours',
}

export type GlobalStats = { [stat in GlobalStat]: number };