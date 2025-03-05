// TODO: probably should refactor this completely to use new event-based OnlineUser observables

import { filter, map, Observable, Subject } from "rxjs";
import { JsonMessage, JsonMessageType, OnConnectMessage, ErrorHandshakeIncompleteMessage, ErrorMessage, ConnectionSuccessfulMessage } from "../../shared/network/json-message";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { decodeMessage, MessageType } from "../../shared/network/ws-message";
import { OnlineUserEvent, OnlineUserEventType, OnSessionBinaryMessageEvent, OnSessionConnectEvent, OnSessionDisconnectEvent, OnSessionJsonMessageEvent, OnUserActivityChangeEvent, OnUserConnectEvent, OnUserDisconnectEvent } from "./online-user-events";
import { BotOnlineUserSession, HumanOnlineUserSession, OnlineUser, OnlineUserActivity, OnlineUserInfo, OnlineUserSession, SessionSocket } from "./online-user";
import { WebSocketServer } from "ws";
import { OnlineUserActivityType } from "../../shared/models/online-activity";
import { BotUser } from "../bot/bot-user";
import { errorHandler } from "../errors/error-handler";

/*
Manages the users that are online right now and thus are connected to socket with websocket.
Sockets, OnlineUsers, and UserSessions are encapsulated here. Instead of directly working
with these objects, the OnlineUserManager emits OnlineUserEvents for state transitions that can
be subscribed to.
*/
export class OnlineUserManager {

    // map of userid to OnlineUser
    private onlineUsers: Map<string, OnlineUser> = new Map<string, OnlineUser>();

    // map of sessionid to session
    private sessions = new Map<string, OnlineUserSession>();

    // handles subscribable online user events
    private events$ = new Subject<OnlineUserEvent>();

    constructor(wss: WebSocketServer) {

        // initialize websocket events
        wss.on('connection', (ws: any) => {

            // forward websocket messages to the online user manager
            ws.on('message', async (message: string) => {
                try {
                    await this.onSocketMessage(ws, message);
                } catch (error: any) {
                    let msg: any;
                    try {
                        msg = await decodeMessage(message, false);
                    } catch {
                        msg = message;
                    }
                    errorHandler.logError(error, "on ws message", msg);
                }
            });

            // forward websocket close events to the online user manager
            ws.on('close', async (code: number, reason: string) => {
                try {
                    this.onSocketClose(ws, code, reason);
                } catch (error: any) {
                    errorHandler.logError(error, "on ws close", code, reason);
                }
            });
        });

        // Self-subscribe to the events observable to log all events
        // this.events$.subscribe(event => {
        //     console.log(`OnlineUserEvent: ${JSON.stringify(event)}`);
        // });
    }

    // Given a websocket, get the session object associated with it
    private getSessionBySocket(ws: WebSocket): OnlineUserSession | undefined {
        return (ws as SessionSocket).session;
    }

    private getSessionByBot(bot: BotUser): OnlineUserSession | undefined {
        return bot.session;
    }

    // Get the userid associated with a sessionID
    public getUserIDBySessionID(sessionID: string): string | undefined {
        return this.sessions.get(sessionID)?.user.userid;
    }

    // Subscribe to a specific OnlineUserEvent type
    // Precondition: ConcreteOnlineUserEvent must match the type of the event.
    // i.e. onEvent$<OnUserConnectEvent>(OnlineUserEventType.ON_USER_CONNECT)
    public onEvent$<ConcreteOnlineUserEvent extends OnlineUserEvent>(type: OnlineUserEventType): Observable<ConcreteOnlineUserEvent> {
        return this.events$.pipe(
            filter(event => event.type === type),
            map(event => event as ConcreteOnlineUserEvent)
        );
    }

    public numOnlineUsers(): number {
        return this.onlineUsers.size;
    }

    public isUserOnline(userid: string): boolean {
        return this.onlineUsers.has(userid);
    }

    public isSessionOnline(sessionID: string): boolean {
        return this.sessions.has(sessionID);
    }

    // Send a message to all online users
    public sendToAllOnlineUsers(message: JsonMessage) {
        this.onlineUsers.forEach(onlineUser => onlineUser.sendMessageToAllSessions(message));
    }

    // Send a message to all sessions of a user. Returns true if the user is online and the message was sent.
    public sendToUser(userid: string, message: JsonMessage | Uint8Array): boolean {
        const onlineUser = this.onlineUsers.get(userid);
        if (onlineUser) {
            onlineUser.sendMessageToAllSessions(message);
            return true;
        }
        return false;
    }

    // Send a message to a specific session of a user. Returns true if the user session is online and the message was sent.
    public sendToUserSession(sessionID: string, message: JsonMessage | Uint8Array): boolean {

        const session = this.sessions.get(sessionID);
        if (!session) return false;
        
        session.sendMessage(message);
        return true;
    }

    public getUserJSON(userid: string): any | undefined {
        const onlineUser = this.onlineUsers.get(userid);
        if (!onlineUser) return undefined;
        return onlineUser.getJSON();
    }

    public getUserInfo(userid: string): OnlineUserInfo | undefined {
        const onlineUser = this.onlineUsers.get(userid);
        if (!onlineUser) return undefined;
        return onlineUser.getInfo();
    }

    public getAllOnlineUserIDs(): string[] {
        return Array.from(this.onlineUsers.keys());
    }

    // Get the activity of a user, if the user is online and in an activity
    public getUserActivity(userid: string): OnlineUserActivity | null {
        const onlineUser = this.onlineUsers.get(userid);
        if (!onlineUser) return null;
        return onlineUser.getActivity();
    }

    // Get the activity type of a user, if the user is online and in an activity
    public getUserActivityType(userid: string): OnlineUserActivityType | null {
        const onlineUser = this.onlineUsers.get(userid);
        if (!onlineUser) return null;
        const activity = onlineUser.getActivity();
        if (!activity) return null;
        return activity.type;
    }

    // Get whether a user is in an activity
    public isUserInActivity(userid: string): boolean {
        const onlineUser = this.onlineUsers.get(userid);
        if (!onlineUser) return false;
        return onlineUser.inActivity();
    }

    // Reset the activity of a user
    public resetUserActivity(userid: string) {
        const onlineUser = this.onlineUsers.get(userid);

        // If the user is not online, do nothing
        if (!onlineUser) return;

        // Set the activity to null, and emit the event
        onlineUser.setActivity(null);
        this.events$.next(new OnUserActivityChangeEvent(userid, onlineUser.username, null));
    }

    // Set the activity of a user, if the user is online and not already in an activity
    public setUserActivity(sessionID: string, activityType: OnlineUserActivityType) {

        // Get the userid from the sessionID
        const userid = this.getUserIDBySessionID(sessionID);
        if (!userid) throw new Error(`User with sessionID ${sessionID} not found`);

        const onlineUser = this.onlineUsers.get(userid);
        if (!onlineUser) throw new Error(`User ${userid} not found`);

        // If already in an activity, throw an error
        if (onlineUser.getActivity() !== null) throw new Error(`User ${userid} is already in an activity`);

        // Set the activity and emit the event
        const activity: OnlineUserActivity = { type: activityType, sessionID };
        onlineUser.setActivity(activity);
        this.events$.next(new OnUserActivityChangeEvent(userid, onlineUser.username, activityType));
    }

    // called when a message is received from a bot
    public onBotMessage(bot: BotUser, message: JsonMessage | PacketDisassembler) {

        if (message instanceof PacketDisassembler) {
            // Received a binary message from the bot
            this.events$.next(new OnSessionBinaryMessageEvent(bot.userid, bot.username, bot.sessionID, message));
        } else {
            // Received a JSON message from the bot
            this.events$.next(new OnSessionJsonMessageEvent(bot.userid, bot.username, bot.sessionID, message));
        }
    }


    // called when a message is received from a client
    public async onSocketMessage(ws: WebSocket, message: any) {

        const { type, data } = await decodeMessage(message, false);
        const session = this.getSessionBySocket(ws);

        if (!session) { // recieved message from socket not yet recognized as online user
            
            if (type === MessageType.JSON && (data as JsonMessage).type === JsonMessageType.ON_CONNECT) {
                // ON_CONNECT is the only message that can be received from an unrecognized socket. Receiving this
                // signals that the client wants to register this socket as an online user.
                const onConnectMessage = data as OnConnectMessage;
                this.handleSocketConnect(onConnectMessage.userid, onConnectMessage.username, ws, onConnectMessage.sessionID);
            }
            else { // if the message is not ON_CONNECT, then client is not allowed to send messages until handshake is complete
                ws.send(JSON.stringify(new ErrorHandshakeIncompleteMessage()));
            }
        } else {

            // recieved message from socket already recognized as online user
            try {
                if (type === MessageType.JSON) {
                    // Received a JSON message for the user session
                    this.events$.next(new OnSessionJsonMessageEvent(
                        session.user.userid, session.user.username, session.sessionID, data as JsonMessage
                    ));
    
                } else {
                    // Received a binary message for the user session
                    this.events$.next(new OnSessionBinaryMessageEvent(
                        session.user.userid, session.user.username, session.sessionID, data as PacketDisassembler
                    ));
                }
            } catch (error: any) {
                console.error(error);
                session.sendMessage(new ErrorMessage(error.toString()));
            }
            
        }
    }

    // called when a bot connects
    public onBotConnect(bot: BotUser): BotOnlineUserSession {
        const newSession = new BotOnlineUserSession(bot.sessionID, bot);
        this.createSession(bot.userid, bot.username, newSession);
        return newSession;
    }

    // Called when a new socket connects with information about the user
    private handleSocketConnect(userid: string, username: string, ws: WebSocket, sessionID: string) {
        const newSession = new HumanOnlineUserSession(sessionID, ws);
        this.createSession(userid, username, newSession);
    }

    private createSession(userid: string, username: string, newSession: OnlineUserSession) {

        // Check if user is already online on a different session. If not, create a new OnlineUser
        let onlineUser = this.onlineUsers.get(userid);
        if (!onlineUser) {
            // Create a new OnlineUser and send new user event
            onlineUser = new OnlineUser(userid, username, newSession);
            this.onlineUsers.set(userid, onlineUser);
            this.events$.next(new OnUserConnectEvent(userid, username));
        } else {
            // Add the new session to the existing OnlineUser
            onlineUser.addSession(newSession);
        }

        // Map the sessionID to the userid
        this.sessions.set(newSession.sessionID, onlineUser.getSessionByID(newSession.sessionID)!);

        // Finish the handshake by sending a connection successful message
        this.sendToUserSession(newSession.sessionID, new ConnectionSuccessfulMessage());

        // Send the session connect event
        this.events$.next(new OnSessionConnectEvent(userid, username, newSession.sessionID));

        console.log(`User ${username} connected with sessionID ${newSession.sessionID}`);
    }

    public onBotDisconnect(bot: BotUser) {
        const session = this.getSessionByBot(bot);
        if (!session) {
            console.error(`Bot ${bot.userid} is not connected, cannot disconnect`);
            return;
        }
        this.deleteSession(session, 1000, "Bot disconnected");
    }

    // called when a socket connection is closed. Close session, and if no more sessions for user, close user.
    public onSocketClose(ws: WebSocket, code: number, reason: string) {

        // get the session associated with the socket
        const session = this.getSessionBySocket(ws);
        if (!session) {
            console.error("Received close event for unrecognized socket");
            return;
        }

        // Disconnect the session
        this.deleteSession(session, code, reason);
    }

    // Disconnect a session
    private deleteSession(session: OnlineUserSession, code: number, reason: string) {

        // get the online user associated with the session
        const onlineUser = session.user;

        // close the session 
        const success = onlineUser.removeSession(session.sessionID, code, reason);
        if (!success) console.error(`Could not delete session ${session.sessionID} with code ${code} reason ${reason}, session does not exist`);

        // remove the sessionID to userid mapping
        this.sessions.delete(session.sessionID);

        // Emit session disconnect event
        this.events$.next(new OnSessionDisconnectEvent(session.user.userid, session.user.username, session.sessionID));

        console.log(`User ${session.user.username} disconnected with sessionID ${session.sessionID}`);

        // if no more sessions for user, close the user and emit user disconnect event
        if (onlineUser.getAllSessions().length === 0) {
            this.onlineUsers.delete(session.user.userid);
            this.events$.next(new OnUserDisconnectEvent(session.user.userid, session.user.username));
        }
    }

}