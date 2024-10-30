import { JsonMessage } from "../../shared/network/json-message";

export interface UserSessionID {
    userid: string,
    sessionID: string,
}

export class OnlineUserSession {

    public readonly sessionStart = Date.now();

    constructor(
        public readonly user: OnlineUser,
        public readonly sessionID: string,
        public readonly socket: WebSocket,
    ) { }

    // Sends a JsonMessage to the connected client for this session
    sendJsonMessage(message: JsonMessage) {
        this.socket.send(JSON.stringify(message));
    }

    closeSocket(code?: number, reason?: string) {
        this.socket.close(code, reason);
    }
}

export interface OnlineUserInfo {
    userid: string,
    username: string,
    sessions: string[]
}

/*
Represents a singular online user connected through socket. Manages all sessions for a user.
*/
export class OnlineUser {

    private readonly userStart = Date.now();

    // maps sessionID to UserSession
    private sessions: Map<string, OnlineUserSession> = new Map();

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
        };
    }

    // add a new session to the user
    addSession(sessionID: string, socket: WebSocket) {
        this.sessions.set(sessionID, new OnlineUserSession(this, sessionID, socket));
    }

    // using the live websocket connection, send a JsonMessage to all the sessions of the client
    sendJsonMessageToAllSessions(message: JsonMessage) {
        console.log(`Sending message to ${this.username}: ${JSON.stringify(message)}`);
        this.sessions.forEach(session => session.sendJsonMessage(message));
    }

    // using the live websocket connection, send a JsonMessage to the specified session
    sendJsonMessageToSession(message: JsonMessage, sessionID: string) {
        const session = this.getSessionByID(sessionID);
        if (!session) throw new Error(`Session ${sessionID} not found for user ${this.username}`);

        console.log(`Sending message to ${this.username} on session ${sessionID}: ${JSON.stringify(message)}`);
        session.sendJsonMessage(message);
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
}