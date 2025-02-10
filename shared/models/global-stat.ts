export enum GlobalStat {
    TOTAL_USER_COUNT = 'total_user_count',
    TOTAL_PUZZLES_SOLVED = 'total_puzzles_solved',
    TOTAL_PUZZLE_HOURS = 'total_puzzle_hours',
}

export type GlobalStats = { [stat: string]: number };