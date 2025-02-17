// Index is stored in database, so do not rearrange
export enum ActivityType {
    PERSONAL_BEST,
    RANKED_MATCH,
    QUEST_COMPLETION,
    PUZZLE_ELO, // i.e. reach 3000 puzzle elo
    RANKED_TROPHIES, // ie. reach 3000 trophies
    LEAGUE_PROMOTION
}

export type PersonalBestActivity = {
    type: ActivityType.PERSONAL_BEST,
    score: number, // Score achieved in personal best
    startLevel: number, // Start level of game
    gameID: string, // id of game in database
}

export type RankedMatchActivity = {
    type: ActivityType.RANKED_MATCH,
    opponentID: string, // userid of opponent
    opponentName: string, // username of opponent
    trophyDelta: number, // trophies gained/lost as a result
    myGameID: string, // id of game played by user in match
    myScore: number, // score achieved by the user
    opponentGameID: string, // id of game played by opponent in match
    opponentScore: number, // score achieved by the opponent
}

// This schema is stored in the data column of Activities table
export type Activity = PersonalBestActivity | RankedMatchActivity;

export interface TimestampedActivity {
    id: number,
    timestamp: string,
    activity: Activity,
}