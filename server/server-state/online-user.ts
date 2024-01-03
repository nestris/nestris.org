import { OnlineUserStatus } from "../../network-protocol/models/friends";
import { JsonMessage } from "../../network-protocol/json-message";

// the reason for closing the socket connection for one specific user. will be sent as an error code in close frame
export enum SocketCloseCode {
    NORMAL = 1000,
    ALREADY_LOGGED_IN = 4000,
    NEW_USER_DUPLICATE_INFO = 4001,
    EMAIL_MISMATCH = 4002,
}

// a mapping to text explanation for the SocketCloseCode
const SocketCloseExplanation: Map<SocketCloseCode, string> = new Map<SocketCloseCode, string>([
    [SocketCloseCode.NORMAL, "User closed window or logged out normally."],
    [SocketCloseCode.ALREADY_LOGGED_IN, "User is already logged in; only one session can be active at a time."],
    [SocketCloseCode.NEW_USER_DUPLICATE_INFO, "User tried to create a new account with an existing username or email."],
    [SocketCloseCode.EMAIL_MISMATCH, "User tried to log in with an incorrect email address."],
]);


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

    // close the websocket connection with the specified close code. Must remove user from OnlineUserManager after calling this.
    closeSocket(closeCode: SocketCloseCode) {
        this.socket.close(closeCode, SocketCloseExplanation.get(closeCode));
    }

}