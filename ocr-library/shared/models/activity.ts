import { QuestID } from "../nestris-org/quest-system";
import { League } from "../nestris-org/league-system";

// Index is stored in database, so do not rearrange
export enum ActivityType {
    PERSONAL_BEST,
    RANKED_MATCH,
    QUEST_COMPLETION,
    PUZZLE_ELO,
    LEAGUE_PROMOTION
};

// EXAMPLE: Scored a new personal best of [score] on level [startLevel] start
export type PersonalBestActivity = {
    type: ActivityType.PERSONAL_BEST,
    score: number, // Score achieved in personal best
    startLevel: number, // Start level of game
    gameID: string, // id of game in database
};

// EXAMPLE: Gained/Lost [trophyDelta] in a ranked match against [opponentName] with score [myScore] to [opponentScore]
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

// EXAMPLE: Completed quest [questName] and gained [xp] xp
export type QuestCompletionActivity = {
    type: ActivityType.QUEST_COMPLETION,
    questID: QuestID,
};

// EXAMPLE: Reached a rating of [elo] in puzzles
export type PuzzleEloActivity = {
    type: ActivityType.PUZZLE_ELO,
    elo: number,
};

// EXAMPLE: Promoted from [oldLeague] to [league] league
export type LeaguePromotionActivity = {
    type: ActivityType.LEAGUE_PROMOTION,
    league: League,
}

// This schema is stored in the data column of Activities table
export type Activity = PersonalBestActivity | RankedMatchActivity | QuestCompletionActivity | PuzzleEloActivity | LeaguePromotionActivity;

export interface TimestampedActivity {
    id: number,
    timestamp: string,
    activity: Activity,
};