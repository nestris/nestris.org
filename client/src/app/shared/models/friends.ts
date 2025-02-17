import { League } from "../nestris-org/league-system";
import { OnlineUserActivityType } from "./online-activity";

// the relationship status between one user and another user
export enum FriendStatus {
FRIENDS = "friends",
INCOMING = "incoming",
OUTGOING = "outgoing",
NOT_FRIENDS = "none"
}


// the schema sent by server to a user for some different user with friend status that is anything besides NOT_FRIENDS
export interface FriendInfo {
    userid: string;
    username: string;
    isOnline: boolean;
    activity: OnlineUserActivityType | null; // the activity the user is currently doing
    league: League;
    highestScore: number;
    trophies: number;
    puzzleElo: number;
}

export interface FriendInfoUpdate {
    userid?: string;
    username?: string;
    isOnline?: boolean;
    activity?: OnlineUserActivityType | null; // the activity the user is currently doing
    league?: League;
    highestScore?: number;
    trophies?: number;
    puzzleElo?: number;
}