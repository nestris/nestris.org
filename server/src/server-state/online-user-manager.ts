// TODO: probably should refactor this completely to use new event-based OnlineUser observables

import { OnlineUserStatus } from "../../shared/models/friends";
import { NotificationType } from "../../shared/models/notifications";
import { JsonMessage, ConnectionSuccessfulMessage, SendPushNotificationMessage, UpdateOnlineFriendsMessage, JsonMessageType, OnConnectMessage, ErrorHandshakeIncompleteMessage, ErrorMessage } from "../../shared/network/json-message";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { decodeMessage, MessageType } from "../../shared/network/ws-message";
import { queryFriendUserIDsForUser, queryUserByUserID, createUser } from "../database/user-queries";
import { handleJsonMessage } from "./message-handler";
import { OnlineUser, UserSession, UserEvent, SocketCloseCode } from "./online-user";
import { ServerState } from "./server-state";

/*
Manages the users that are online right now and thus are connected to socket with websocket
*/
export class OnlineUserManager {

    // map of userid to OnlineUser
    private onlineUsers: Map<string, OnlineUser> = new Map<string, OnlineUser>();

    constructor(private readonly state: ServerState) {}

    public getOnlineUsersJSON(): any {
        const onlineUsers = Array.from(this.onlineUsers.values());
        return onlineUsers.map(onlineUser => {
            return {
                username: onlineUser.username,
                status: onlineUser.status,
                onlineDuration: `${Math.floor((Date.now() - onlineUser.connectTime) / 1000)} seconds`
            }
        });
    }

    public numOnlineUsers(): number {
        return this.onlineUsers.size;
    }

    // get the number of friends that are online for a user
    public async numOnlineFriends(userid: string): Promise<number> {
        const friends = await queryFriendUserIDsForUser(userid);
        return friends.filter(friend => this.isOnline(friend)).length;
    }

    public getOnlineUserByUserID(userid: string): OnlineUser | undefined {
        return this.onlineUsers.get(userid);
    }

    public getOnlineUserBySocket(socket: WebSocket): OnlineUser | undefined {
        return Array.from(this.onlineUsers.values()).find(onlineUser => onlineUser.hasSocket(socket));
    }

    public getSessionBySocket(socket: WebSocket): UserSession | undefined {
        const onlineUser = this.getOnlineUserBySocket(socket);
        return onlineUser?.getSessionBySocket(socket);
    }

    public isOnline(userid: string): boolean {
        return this.onlineUsers.has(userid);
    }

    // get whether the user is online, and if so, what the user is doing
    public getOnlineStatus(userid: string): OnlineUserStatus {
        const user = this.getOnlineUserByUserID(userid);
        if (user === undefined) return OnlineUserStatus.OFFLINE;
        return user.status;
    }

    public sendToAllOnlineUsers(message: JsonMessage) {
        this.onlineUsers.forEach(onlineUser => onlineUser.sendJsonMessage(message));
    }

    // on user connect, add to online pool, and update friends' online friends
    // if user does not exist, add user to database
    // if user is already online, add the socket to the user's sockets
    public async onUserConnect(userid: string, username: string, socket: WebSocket, sessionID: string) {

        console.log(`User ${username} with id ${userid} attempting to connect.`);

        // if user is already online, add the socket to the user's sockets
        const alreadyOnlineUser = this.getOnlineUserByUserID(userid);
        if (alreadyOnlineUser) {
            alreadyOnlineUser.addSession(socket, sessionID);
            console.log(`User ${username} is already online, adding socket.`);

            alreadyOnlineUser.notify(UserEvent.ON_SOCKET_CONNECT);

            // finish handshake by sending the user a message that they are connected
            alreadyOnlineUser.sendJsonMessageToSocket(new ConnectionSuccessfulMessage(), socket);
            return;
        }

        // get the user's friends from the database
        let user = (await queryUserByUserID(userid));

        // if user does not exist, add user to database
        if (!user) {
            console.error(`User ${username} with id ${userid} should not be initiating websocket connection, as they do not exist in the database.`);
            return;
        }

        // create a new OnlineUser
        const onlineUser = new OnlineUser(this.state, userid, username, socket, sessionID);

        // add the user to the online pool
        this.onlineUsers.set(userid, onlineUser);

        // update the online friends of the user's friends
        const friends = await queryFriendUserIDsForUser(userid);
        console.log(`User ${username} has friends: ${friends.join(", ")}`);
        for (const friend of friends) {
            
            if (this.isOnline(friend)) { // if user's friend is online
                console.log(`User ${friend} is online.`);

                // send the friend a message that the user is online
                const friendOnlineUser = this.getOnlineUserByUserID(friend)!;
                friendOnlineUser.sendJsonMessage(new SendPushNotificationMessage(
                    NotificationType.SUCCESS,
                    `${username} is now online!`
                ));
                friendOnlineUser.sendJsonMessage(new UpdateOnlineFriendsMessage());
            }
        }

        // finish handshake by sending the user a message that they are connected
        console.log(`User ${username} connected.`);
        onlineUser.sendJsonMessageToSocket(new ConnectionSuccessfulMessage(), socket);
    }

    // when user changes status, update friends' online friends
    public async updateFriendsOnUserStatusChange(userid: string) {
        const friends = await queryFriendUserIDsForUser(userid);
        for (const friend of friends) {
            
            if (this.isOnline(friend)) { // if user's friend is online

                // send the friend a message that the user is online
                const friendOnlineUser = this.getOnlineUserByUserID(friend)!;
                friendOnlineUser.sendJsonMessage(new UpdateOnlineFriendsMessage());
            }
        }
    }

    // on user disconnect, remove from online pool, and update friends' online friends
    public async onUserDisconnect(userid: string) {

        // update the online friends of the user's friends
        const friends = await queryFriendUserIDsForUser(userid);
        for (const friend of friends) {
            
            if (this.isOnline(friend)) { // if user's friend is online

                // send the friend a message that the user is offline
                const friendOnlineUser = this.getOnlineUserByUserID(friend)!;
                friendOnlineUser.sendJsonMessage(new SendPushNotificationMessage(
                    NotificationType.ERROR,
                    `${userid} went offline.`
                ));
                friendOnlineUser.sendJsonMessage(new UpdateOnlineFriendsMessage());
            }
        }

        const onlineUser = this.getOnlineUserByUserID(userid);
        onlineUser?.notify(UserEvent.ON_USER_OFFLINE);

        // remove the user from the online pool
        this.onlineUsers.delete(userid);
        console.log(`User ${userid} disconnected.`);
    }

    // called when a message is received from a client
    public async onSocketMessage(ws: WebSocket, message: any) {

        // console.log(`Received message from ${this.getOnlineUserBySocket(ws)?.username}: ${message}`);

        const { type, data } = await decodeMessage(message, false);
        const onlineUser = this.getOnlineUserBySocket(ws);

        if (!onlineUser) { // recieved message from socket not yet recognized as online user
            
            if (type === MessageType.JSON && (data as JsonMessage).type === JsonMessageType.ON_CONNECT) {
                // ON_CONNECT is the only message that can be received from an unrecognized socket
                // we convert the socket to an OnlineUser and add it to the online pool
                const userInfo = (data as OnConnectMessage);
                await this.onUserConnect(userInfo.userid, userInfo.username, ws, userInfo.sessionID);
            }
            else { // if the message is not ON_CONNECT, then client is not allowed to send messages until handshake is complete
                ws.send(JSON.stringify(new ErrorHandshakeIncompleteMessage()));
            }
        } else {

            const session = onlineUser.getSessionBySocket(ws);

            if (!session) console.error(`Session not found for user ${onlineUser.username} and socket ${ws}`);

            // recieved message from socket recognized as online user
            try {
                if (type === MessageType.JSON) {
                    await handleJsonMessage(this.state, session!, data as JsonMessage);
                } else {
                    await this.state.roomManager.onBinaryMessage(ws, data as PacketDisassembler);

                }
            } catch (error: any) {
                console.error(error);
                onlineUser.sendJsonMessage(new ErrorMessage(error.toString()));
            }
            
        }
    }

    // called when a socket connection is closed
    public async onSocketClose(ws: WebSocket, code: number, reason: string) {

        console.log(`Socket closed with code ${code} and reason ${reason}`);

        await this.state.roomManager.removeSocket(ws); // close any rooms associated with the socket


        const onlineUser = this.getOnlineUserBySocket(ws);
        if (onlineUser) {
            const isCompletelyOffline = onlineUser.closeSocket(ws, SocketCloseCode.NORMAL); // whether the user is completely offline, or still has other sockets open
            onlineUser.notify(UserEvent.ON_SOCKET_CLOSE);
            
            if (isCompletelyOffline) {
                await this.onUserDisconnect(onlineUser.userid);
                console.log(`So, user ${onlineUser.username} completely disconnected.`);
            } else {
                console.log(`User ${onlineUser.username} disconnected from one socket, but still has other sockets open.`);
            }            
        }

    }

}