import { League } from "../nestris-org/league-system";

// the relationship status between one user and another user
export enum FriendStatus {
FRIENDS = "friends",
INCOMING = "incoming",
OUTGOING = "outgoing",
NOT_FRIENDS = "none"
}

export interface FriendStatusResult {
    status: FriendStatus | undefined;
}


// the schema sent by server to a user for some different user with friend status that is anything besides NOT_FRIENDS
export interface FriendInfo {
    userid: string;
    username: string;
    friendStatus: FriendStatus;
    isOnline: boolean;
    league: League;
    highestScore: number;
    trophies: number;
    puzzleElo: number;
}
