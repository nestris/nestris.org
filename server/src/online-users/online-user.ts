import { OnlineUserActivityType } from "../../shared/models/online-activity";
import { JsonMessage } from "../../shared/network/json-message";
import { BotUser } from "../bot/bot-user";

export interface UserSessionID {
    userid: string,
    sessionID: string,
}

export abstract class OnlineUserSession {
    public readonly sessionStart = Date.now();
    public user!: OnlineUser;

    constructor(
        public readonly sessionID: string,
    ) {}

    // Initialize the session with the user
    public init(user: OnlineUser) {
        this.user = user;
        console.log(`Session ${this.sessionID} created for user ${user.username} (${this.constructor.name})`);

    }   

    public abstract sendMessage(message: JsonMessage | Uint8Array): void;
    public terminateSession(code?: number, reason?: string): void {}
    
}

export class SessionSocket extends WebSocket {
    session: OnlineUserSession | undefined;
}

export class HumanOnlineUserSession extends OnlineUserSession {
    private readonly socket: SessionSocket;

    constructor(sessionID: string, socket: WebSocket,
    ) {
        super(sessionID);

        // Assign the socket a reference to this session, so that session can be derived from the socket in the future
        this.socket = socket as SessionSocket;
        this.socket.session = this;
    }

    // Sends a binary or JsonMessage to the connected client for this session
    public override sendMessage(message: JsonMessage | Uint8Array) {
        if (message instanceof Uint8Array) this.socket.send(message);
        else this.socket.send(JSON.stringify(message));
    }

    private static VALID_CLOSE_CODES = new Set([
        1000, 1001, 1002, 1003, 1005, 1006, 1007, 1008, 1009, 1010, 
        1011, 1012, 1013, 1014, 1015
    ]);
    public override terminateSession(code?: number, reason?: string) {
        // Ensure code is a valid number; default to 1000 if invalid
        if (typeof code !== "number" || !HumanOnlineUserSession.VALID_CLOSE_CODES.has(code)) {
            console.warn(`Invalid WebSocket close code: ${code}. Defaulting to 1000.`);
            code = 1000;
        }

        this.socket.close(code, reason);
    }
}

export class BotOnlineUserSession extends OnlineUserSession {
    
    constructor(sessionID: string, private readonly bot: BotUser) {
        super(sessionID);
    }

    // Route the message to the bot
    public override sendMessage(message: JsonMessage | Uint8Array): void {
        // Don't log binary messages to reduce log spam
        if (message instanceof Uint8Array) this.bot.onBinaryMessageFromServer(message);
        else {
            console.log(`Sending message to bot ${this.bot.username}: ${JSON.stringify(message)}`);
            this.bot.onJsonMessageFromServer(message);
        }
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
        session: OnlineUserSession,
    ) {
        this.addSession(session);
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
    addSession(session: OnlineUserSession) {
        session.init(this);
        this.sessions.set(session.sessionID, session);
    }

    // using the live websocket connection, send a JsonMessage to all the sessions of the client
    sendMessageToAllSessions(message: JsonMessage | Uint8Array) {
        //console.log(`Sending message to ${this.username}: ${JSON.stringify(message)}`);
        this.sessions.forEach(session => session.sendMessage(message));
    }

    // using the live websocket connection, send a JsonMessage to the specified session
    // returns whether sending the message was successful
    sendMessageToSession(message: JsonMessage | Uint8Array, sessionID: string): boolean {
        const session = this.getSessionByID(sessionID);
        if (!session) return false;

        //console.log(`Sending message to ${this.username} on session ${sessionID}: ${JSON.stringify(message)}`);
        session.sendMessage(message);
        return true;
    }

    // close the websocket connection with the specified close code.
    // returns whether removing the session was successful
    removeSession(sessionID: string, code?: number, reason?: string): boolean {
        const session = this.getSessionByID(sessionID);
        if (!session) return false;

        session.terminateSession(code, reason);
        
        // remove the session from the map
        this.sessions.delete(sessionID);
        return true;
    }

    // Gets list of all session IDs for this user
    getAllSessions(): OnlineUserSession[] {
        return Array.from(this.sessions.values());
    }

    getSessionByID(sessionID: string): OnlineUserSession | undefined {
        return this.sessions.get(sessionID);
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