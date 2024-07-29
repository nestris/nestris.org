import { OnlineUserStatus } from "../../shared/models/friends";
import { OnlineUserInfo } from "../../shared/models/online-user-info";
import { JsonMessage } from "../../shared/network/json-message";
import { ServerState } from "./server-state";


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
    [SocketCloseCode.EMAIL_MISMATCH, "User tried to login with an incorrect email address."],
]);

// events that OnlineUsers emit to subscribers
export enum UserEvent {
    ON_SOCKET_CONNECT = "SOCKET_CONNECT", // when a new socket connects
    ON_SOCKET_CLOSE = "SOCKET_CLOSE", // when a socket closes.
    ON_ENTER_ROOM = "ENTER_ROOM", // when a user enters a room
    ON_LEAVE_ROOM = "LEAVE_ROOM", // when a user leaves a room
    ON_USER_OFFLINE = "USER_OFFLINE", // when a user goes offline. OnlineUser is deleted after this event.
}

export class UserSession {
    constructor(
        public readonly user: OnlineUser,
        public readonly sessionID: string,
        public readonly socket: WebSocket,
    ) { }

}

/*
Represents a singular online user connected through socket. Track user status and socket connection.
*/
export class OnlineUser {

    public connectTime: number = Date.now();
    public status: OnlineUserStatus = OnlineUserStatus.IDLE; // status should not be offline as long as object exists

    private sessions: UserSession[] = [];

    private eventSubscribers: Map<UserEvent, Set<Function>> = new Map();

    constructor(
        public readonly state: ServerState,
        public readonly userid: string, // unique identifier for the user
        public readonly username: string,
        socket: WebSocket, // live websocket connection
        public readonly sessionID: string, // unique identifier for the session
        //public readonly friends: string[], // set of usernames of friends
    ) {
        this.sessions.push(new UserSession(this, sessionID, socket));

        // subscribe to each event and log it
        for (const event of Object.values(UserEvent)) {
            this.subscribe(event, () => console.log(`User ${this.username} emitted event ${event}`));
        }
    }

    // add a new session to the user
    addSession(socket: WebSocket, sessionID: string) {
        this.sessions.push(new UserSession(this, sessionID, socket));
    }

    // check if the user has an ongoing session with the specified sessionID
    containsSessionID(sessionID: string): boolean {
        return this.sessions.some(session => session.sessionID === sessionID);
    }

    getSessionBySocket(socket: WebSocket): UserSession | undefined {
        return this.sessions.find(session => session.socket === socket);
    }

    getSessionByID(sessionID: string): UserSession | undefined {
        return this.sessions.find(session => session.sessionID === sessionID);
    }

    // using the live websocket connection, send a JsonMessage to all the sessions of the client
    sendJsonMessage(message: JsonMessage) {
        this.sessions.forEach(session => {
            console.log(`Sending message to ${this.username}: ${JSON.stringify(message)}`);
            session.socket.send(JSON.stringify(message));
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
        this.sessions = this.sessions.filter(session => session.socket !== socket);
        return this.sessions.length === 0;
    }

    // when user starts playing game, update status, and friends should be notified about status change
    onEnterRoom() {
        this.status = OnlineUserStatus.PLAYING;
        this.notify(UserEvent.ON_ENTER_ROOM);
        this.state.onlineUserManager.updateFriendsOnUserStatusChange(this.userid);
    }

    // when user stops playing game, update status, and friends should be notified about status change
    onLeaveRoom() {
        this.status = OnlineUserStatus.IDLE;
        this.notify(UserEvent.ON_LEAVE_ROOM);
        this.state.onlineUserManager.updateFriendsOnUserStatusChange(this.userid);
    }

    getStatus(): OnlineUserStatus {
        return this.status;
    }

    hasSocket(socket: WebSocket): boolean {
        return this.sessions.some(session => session.socket === socket);
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

    getOnlineUserInfo(state: ServerState): OnlineUserInfo {
        return {
            userid: this.userid,
            username: this.username,
            status: this.status,
            connectTime: this.connectTime,
            sessions: this.sessions.map(session => session.sessionID),
            roomID: state.roomManager.getUserByUserID(this.userid)?.room.roomID
        }
    }


}