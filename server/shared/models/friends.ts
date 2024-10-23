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

// stored by the server. keeps track of whether user is online, and what the user is doing if so
export enum OnlineUserStatus {
    IDLE = "IDLE",
    PLAYING = "PLAYING",
    OFFLINE = "OFFLINE"
}

// the schema sent by server to a user for some different user with friend status that is anything besides NOT_FRIENDS
export interface FriendInfo {
    userid: string;
    username: string;
    friendStatus: FriendStatus;
    onlineStatus: OnlineUserStatus;
    league: League;
    highestScore: number;
    trophies: number;
    puzzleElo: number;
}
