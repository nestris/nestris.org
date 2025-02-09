export enum GlobalStat {
    TOTAL_USER_COUNT = 'total_user_count',
    TOTAL_PUZZLES_SOLVED = 'total_puzzles_solved',
}

export type GlobalStats = { [stat: string]: number };