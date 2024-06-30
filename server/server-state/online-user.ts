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

// events that OnlineUsers emit to subscribers
export enum UserEvent {
    ON_SOCKET_CONNECT = "SOCKET_CONNECT", // when a new socket connects
    ON_SOCKET_CLOSE = "SOCKET_CLOSE", // when a socket closes.
    ON_ENTER_GAME = "ENTER_GAME", // when a user enters a game
    ON_LEAVE_GAME = "LEAVE_GAME", // when a user leaves a game
    ON_USER_OFFLINE = "USER_OFFLINE", // when a user goes offline. OnlineUser is deleted after this event.
}

/*
Represents a singular online user connected through socket. Track user status and socket connection.
*/
export class OnlineUser {

    public connectTime: number = Date.now();
    public status: OnlineUserStatus = OnlineUserStatus.IDLE; // status should not be offline as long as object exists

    public sockets: WebSocket[] = [];

    private eventSubscribers: Map<UserEvent, Set<Function>> = new Map();

    constructor(
        public readonly username: string, // unique identifier for the user
        socket: WebSocket, // live websocket connection
        //public readonly friends: string[], // set of usernames of friends
    ) {
        this.sockets.push(socket);

        // subscribe to each event and log it
        for (const event of Object.values(UserEvent)) {
            this.subscribe(event, () => console.log(`User ${this.username} emitted event ${event}`));
        }
    }

    // using the live websocket connection, send a JsonMessage to the client
    sendJsonMessage(message: JsonMessage) {
        this.sockets.forEach(socket => {
            console.log(`Sending message to ${this.username}: ${JSON.stringify(message)}`);
            socket.send(JSON.stringify(message));
        });
    }

    sendJsonMessageToSocket(message: JsonMessage, socket: WebSocket) {
        console.log(`Sending message to ${this.username} @socket: ${JSON.stringify(message)}`);
        socket.send(JSON.stringify(message));
    }

    // close the websocket connection with the specified close code.
    // returns true if there are no more open sockets
    closeSocket(socket: WebSocket, closeCode: SocketCloseCode): boolean {
        socket.close(closeCode, SocketCloseExplanation.get(closeCode));
        this.sockets = this.sockets.filter(s => s !== socket);
        return this.sockets.length === 0;
    }

    hasSocket(socket: WebSocket): boolean {
        return this.sockets.includes(socket);
    }

    // subscribe to an event
    subscribe(event: UserEvent, callback: Function) {
        if (!this.eventSubscribers.has(event)) {
            this.eventSubscribers.set(event, new Set());
        }
        this.eventSubscribers.get(event)?.add(callback);
    }

    // notify all subscribers of an event
    notify(event: UserEvent) {
        this.eventSubscribers.get(event)?.forEach(callback => callback());
    }


}