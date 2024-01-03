// the relationship status between one user and another user
export enum FriendStatus {
    FRIENDS = "Friends",
    PENDING = "Pending",
    INCOMING = "Incoming",
    NOT_FRIENDS = "Not Friends"
}

// stored by the server. keeps track of whether user is online, and what the user is doing if so
export enum OnlineUserStatus {
    IDLE = "IDLE",
    SOLO = "SOLO",
    VERSUS = "VERSUS",
    SANDBOX = "SANDBOX",
    PUZZLES = "PUZZLES",
    ANALYSIS = "ANALYSIS",
    OFFLINE = "OFFLINE"
}

// the schema sent by server to a user for some different user with friend status that is anything besides NOT_FRIENDS
export class FriendInfo {
    constructor(
        public username: string,
        public friendStatus: FriendStatus,
        public onlineStatus: OnlineUserStatus,
        public xp: number,
        public trophies: number,
    ) {}
}
