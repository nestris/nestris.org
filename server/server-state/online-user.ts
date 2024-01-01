import { JsonMessage } from "network-protocol/json-message";
import { getUserByUsername } from "server/database/user/user-service";

export enum OnlineUserStatus {
    IDLE = 0,
    SOLO = 1,
    VERSUS = 2,
    SANDBOX = 3,
    PUZZLES = 4,
    ANALYSIS = 5,
    OFFLINE = 6
}

/*
Represents a singular online user connected through socket. Track user status and socket connection.
*/
export class OnlineUser {

    public connectTime: number = Date.now();
    public status: OnlineUserStatus = OnlineUserStatus.IDLE; // status should not be offline as long as object exists

    // set of usernames of online friends. maintained by OnlineUserManager
    public onlineFriends: Set<string> = new Set<string>(); 

    constructor(
        public readonly username: string, // unique identifier for the user
        public readonly socket: WebSocket, // live websocket connection
        public readonly friends: string[], // set of usernames of friends
    ) {}

    // using the live websocket connection, send a JsonMessage to the client
    sendJsonMessage(message: JsonMessage) {
        this.socket.send(JSON.stringify(message));
    }

}