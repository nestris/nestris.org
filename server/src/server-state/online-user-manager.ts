// TODO: probably should refactor this completely to use new event-based OnlineUser observables

import { filter, map, Observable, Subject } from "rxjs";
import { JsonMessage, JsonMessageType, OnConnectMessage, ErrorHandshakeIncompleteMessage, ErrorMessage } from "../../shared/network/json-message";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { decodeMessage, MessageType } from "../../shared/network/ws-message";
import { queryFriendUserIDsForUser } from "../database-old/user-queries";
import { OnlineUserEvent, OnlineUserEventType, OnSessionBinaryMessageEvent, OnSessionConnectEvent, OnSessionDisconnectEvent, OnSessionJsonMessageEvent, OnUserConnectEvent, OnUserDisconnectEvent } from "./online-user-events";
import { OnlineUser, OnlineUserInfo, OnlineUserSession } from "./online-user";
import { WebSocketServer } from "ws";

/*
Manages the users that are online right now and thus are connected to socket with websocket.
Sockets, OnlineUsers, and UserSessions are encapsulated here. Instead of directly working
with these objects, the OnlineUserManager emits OnlineUserEvents for state transitions that can
be subscribed to.
*/
export class OnlineUserManager {

    // map of userid to OnlineUser
    private onlineUsers: Map<string, OnlineUser> = new Map<string, OnlineUser>();

    // handles subscribable online user events
    private events$ = new Subject<OnlineUserEvent>();

    constructor(wss: WebSocketServer) {

        // initialize websocket events
        wss.on('connection', (ws: any) => {

            // forward websocket messages to the online user manager
            ws.on('message', (message: string) => {
                this.onSocketMessage(ws, message);
            });

            // forward websocket close events to the online user manager
            ws.on('close', (code: number, reason: string) => {
                this.onSocketClose(ws, code, reason);
            });
        });

        // Self-subscribe to the events observable to log all events
        this.events$.subscribe(event => {
            console.log(`OnlineUserEvent: ${JSON.stringify(event)}`);
        });
    }

    // Given a websocket, get the session object associated with it. Keep private, as external classes
    // should not access these objects directly.
    private getSessionBySocket(ws: WebSocket): OnlineUserSession | undefined {
        for (const onlineUser of this.onlineUsers.values()) {
            const session = onlineUser.getSessionBySocket(ws);
            if (session) return session;
        }
        return undefined;
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

    // get userid of all of a person's friends that are online
    public async getOnlineFriends(userid: string): Promise<string[]> {
        const friends = await queryFriendUserIDsForUser(userid);
        return friends.filter(friend => this.isUserOnline(friend));
    }

    public isUserOnline(userid: string): boolean {
        return this.onlineUsers.has(userid);
    }

    public sendToAllOnlineUsers(message: JsonMessage) {
        this.onlineUsers.forEach(onlineUser => onlineUser.sendJsonMessageToAllSessions(message));
    }

    // Send a message to all sessions of a user. Returns true if the user is online and the message was sent.
    public sendToUser(userid: string, message: JsonMessage): boolean {
        const onlineUser = this.onlineUsers.get(userid);
        if (onlineUser) {
            onlineUser.sendJsonMessageToAllSessions(message);
            return true;
        }
        return false;
    }

    // Send a message to a specific session of a user. Returns true if the user session is online and the message was sent.
    public sendToUserSession(userid: string, sessionID: string, message: JsonMessage): boolean {
        const onlineUser = this.onlineUsers.get(userid);
        if (onlineUser) {
            try {
                onlineUser.sendJsonMessageToSession(message, sessionID);
            } catch (error: any) {
                return false;
            }
            return true;
        }
        return false;
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
                session.sendJsonMessage(new ErrorMessage(error.toString()));
            }
            
        }
    }

    // Called when a new socket connects with information about the user
    private handleSocketConnect(userid: string, username: string, ws: WebSocket, sessionID: string) {

        // Check if user is already online on a different session. If not, create a new OnlineUser
        let onlineUser = this.onlineUsers.get(userid);
        if (!onlineUser) {
            // Create a new OnlineUser and send new user event
            onlineUser = new OnlineUser(userid, username, sessionID, ws);
            this.onlineUsers.set(userid, onlineUser);
            this.events$.next(new OnUserConnectEvent(userid, username));
        } else {
            // Add the new session to the existing OnlineUser
            onlineUser.addSession(sessionID, ws);
        }

        // Send the session connect event
        this.events$.next(new OnSessionConnectEvent(userid, username, sessionID));
    }

    // called when a socket connection is closed. Close session, and if no more sessions for user, close user.
    public async onSocketClose(ws: WebSocket, code: number, reason: string) {

        // get the session associated with the socket
        const session = this.getSessionBySocket(ws);
        if (!session) {
            console.error("Received close event for unrecognized socket");
            return;
        }

        // get the online user associated with the session
        const onlineUser = session.user;

        // close the session and emit session disconnect event
        onlineUser.removeSession(session.sessionID, code, reason);
        this.events$.next(new OnSessionDisconnectEvent(session.user.userid, session.user.username, session.sessionID));

        // if no more sessions for user, close the user and emit user disconnect event
        if (onlineUser.getAllSessions().length === 0) {
            this.onlineUsers.delete(session.user.userid);
            this.events$.next(new OnUserDisconnectEvent(session.user.userid, session.user.username));
        }
    }

}