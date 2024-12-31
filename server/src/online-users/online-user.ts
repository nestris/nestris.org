import { OnlineUserActivityType } from "../../shared/models/activity";
import { JsonMessage } from "../../shared/network/json-message";

export class SessionSocket extends WebSocket {
    session: OnlineUserSession | undefined;
}

export interface UserSessionID {
    userid: string,
    sessionID: string,
}

export class OnlineUserSession {

    public readonly sessionStart = Date.now();
    public readonly socket: SessionSocket;

    constructor(
        public readonly user: OnlineUser,
        public readonly sessionID: string,
        _socket: WebSocket,
    ) {
        // Assign the socket a reference to this session
        this.socket = _socket as SessionSocket;
        this.socket.session = this;
        console.log(`Session ${sessionID} created for user ${user.username}`);
    }

    // Sends a binary or JsonMessage to the connected client for this session
    sendMessage(message: JsonMessage | Uint8Array) {
        if (message instanceof Uint8Array) this.socket.send(message);
        else this.socket.send(JSON.stringify(message));
    }

    closeSocket(code?: number, reason?: string) {
        this.socket.close(code, reason);
    }
}


// The type of activity the user is currently doing and the sessionID of the session that is doing it
export interface OnlineUserActivity {
    type: OnlineUserActivityType,
    sessionID: string,
}

// A struct containing all the information about a user that is online
export interface OnlineUserInfo {
    userid: string,
    username: string,
    sessions: string[],
    activity: OnlineUserActivity | null,
}

/*
Represents a singular online user connected through socket. Manages all sessions for a user.
*/
export class OnlineUser {

    private readonly userStart = Date.now();

    // maps sessionID to UserSession
    private sessions: Map<string, OnlineUserSession> = new Map();

    // The activity the user is currently doing. Only one activity can be done at a time by any session.
    private activity: OnlineUserActivity | null = null;

    constructor(
        public readonly userid: string, // unique identifier for the user
        public readonly username: string, // username of the user
        sessionID: string, // unique identifier for the first session created for the user
        socket: WebSocket, // websocket connection
    ) {
        this.sessions.set(sessionID, new OnlineUserSession(this, sessionID, socket));
    }

    // Get debug information about the user
    getJSON() {
        return {
            userid: this.userid,
            username: this.username,
            userStart: this.userStart.toString(),
            sessions: Array.from(this.sessions.keys()).map(sessionID => {
                const session = this.sessions.get(sessionID)!;
                return {
                    sessionID,
                    sessionStart: session.sessionStart.toString(),
                };
            }),
        };
    }

    getInfo(): OnlineUserInfo {
        return {
            userid: this.userid,
            username: this.username,
            sessions: Array.from(this.sessions.keys()),
            activity: this.activity,
        };
    }

    // add a new session to the user
    addSession(sessionID: string, socket: WebSocket) {
        this.sessions.set(sessionID, new OnlineUserSession(this, sessionID, socket));
    }

    // using the live websocket connection, send a JsonMessage to all the sessions of the client
    sendMessageToAllSessions(message: JsonMessage | Uint8Array) {
        //console.log(`Sending message to ${this.username}: ${JSON.stringify(message)}`);
        this.sessions.forEach(session => session.sendMessage(message));
    }

    // using the live websocket connection, send a JsonMessage to the specified session
    sendMessageToSession(message: JsonMessage | Uint8Array, sessionID: string) {
        const session = this.getSessionByID(sessionID);
        if (!session) throw new Error(`Session ${sessionID} not found for user ${this.username}`);

        //console.log(`Sending message to ${this.username} on session ${sessionID}: ${JSON.stringify(message)}`);
        session.sendMessage(message);
    }

    // close the websocket connection with the specified close code.
    // returns true if there are no more sessions for the user
    removeSession(sessionID: string, code?: number, reason?: string) {
        const session = this.getSessionByID(sessionID);
        if (!session) throw new Error(`Session ${sessionID} not found for user ${this.username}`);

        session.closeSocket(code, reason);
        
        // remove the session from the map
        this.sessions.delete(sessionID);
    }

    // Gets list of all session IDs for this user
    getAllSessions(): OnlineUserSession[] {
        return Array.from(this.sessions.values());
    }

    getSessionByID(sessionID: string): OnlineUserSession | undefined {
        return this.sessions.get(sessionID);
    }

    // Finds the session ID for the given socket, or undefined if not found
    getSessionBySocket(socket: WebSocket): OnlineUserSession | undefined {
        for (const session of this.sessions.values()) {
            if (session.socket === socket) {
                return session;
            }
        }
        return undefined;
    }

    // Sets the activity of the user
    setActivity(activity: OnlineUserActivity | null) {
        this.activity = activity;
    }

    // Gets the activity of the user
    getActivity(): OnlineUserActivity | null {
        return this.activity;
    }

    // Returns true if the user is currently doing some activity
    inActivity(): boolean {
        return this.activity !== null;
    }
}