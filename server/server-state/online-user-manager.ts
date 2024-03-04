import { OnlineUser, SocketCloseCode } from "./online-user";
import { ConnectionSuccessfulMessage, ErrorHandshakeIncompleteMessage, ErrorMessage, JsonMessage, JsonMessageType, OnConnectMessage, SendPushNotificationMessage } from "../../network-protocol/json-message";
import { MessageType, decodeMessage } from "../../network-protocol/ws-message";
import { ServerState } from "./server-state";
import { handleJsonMessage } from "./message-handler";
import { OnlineUserStatus } from "../../network-protocol/models/friends";
import { contains } from "misc/array-functions";
import { concat } from "rxjs";
import { createUser, queryFriendUsernamesForUser, queryUserTableForUser } from "../database/user-queries";
import { NotificationType } from "../../network-protocol/models/notifications";

/*
Manages the users that are online right now and thus are connected to socket with websocket
*/
export class OnlineUserManager {

    // map of username to OnlineUser
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

    public getOnlineUsernames(): string[] {
        return Array.from(this.onlineUsers.keys());
    }

    public numOnlineUsers(): number {
        return this.onlineUsers.size;
    }

    // get the number of friends that are online for a user
    public async numOnlineFriends(username: string): Promise<number> {
        const friends = await queryFriendUsernamesForUser(username);
        return friends.filter(friend => this.isOnline(friend)).length;
    }

    public getOnlineUserByUsername(username: string): OnlineUser | undefined {
        return this.onlineUsers.get(username);
    }

    public getOnlineUserBySocket(socket: WebSocket): OnlineUser | undefined {
        return Array.from(this.onlineUsers.values()).find(onlineUser => onlineUser.socket === socket);
    }

    public isOnline(username: string): boolean {
        return this.onlineUsers.has(username);
    }

    // get whether the user is online, and if so, what the user is doing
    public getOnlineStatus(username: string): OnlineUserStatus {
        const user = this.getOnlineUserByUsername(username);
        if (user === undefined) return OnlineUserStatus.OFFLINE;
        return user.status;
    }

    public sendToAllOnlineUsers(message: JsonMessage) {
        this.onlineUsers.forEach(onlineUser => onlineUser.sendJsonMessage(message));
    }

    // on user connect, add to online pool, and update friends' online friends
    // if user does not exist, add user to database
    // if user is already online, refuse connection
    public async onUserConnect(username: string, socket: WebSocket) {

        console.log(`User ${username} attempting to connect.`);

        // if user is already online, refuse connection
        if (this.isOnline(username)) {
            console.log(`User ${username} is already online, refusing connection.`);
            (new OnlineUser(username, socket)).closeSocket(SocketCloseCode.ALREADY_LOGGED_IN);
            return;
        }

        // get the user's friends from the database
        let user = (await queryUserTableForUser(username));

        // if user does not exist, add user to database
        if (!user) {
            console.log(`User ${username} does not exist, creating new user.`);
            try {
                await createUser(username);
            } catch (error) {
                console.error(error);
                (new OnlineUser(username, socket)).closeSocket(SocketCloseCode.NEW_USER_DUPLICATE_INFO);
                return;
            }
        }


        // create a new OnlineUser
        const onlineUser = new OnlineUser(username, socket);

        // add the user to the online pool
        this.onlineUsers.set(username, onlineUser);

        // update the online friends of the user's friends
        const friends = await queryFriendUsernamesForUser(username);
        for (const friend of friends) {
            
            if (this.isOnline(friend)) { // if user's friend is online

                // send the friend a message that the user is online
                const friendOnlineUser = this.getOnlineUserByUsername(friend)!;
                friendOnlineUser.sendJsonMessage(new SendPushNotificationMessage(
                    NotificationType.SUCCESS,
                    `${username} is now online!`
                ));
            }
        }

        // finish handshake by sending the user a message that they are connected
        console.log(`User ${username} connected.`);
        onlineUser.sendJsonMessage(new ConnectionSuccessfulMessage());

    }

    // on user disconnect, remove from online pool, and update friends' online friends
    public async onUserDisconnect(username: string) {
        const onlineUser = this.onlineUsers.get(username)!;

        // update the online friends of the user's friends
        const friends = await queryFriendUsernamesForUser(username);
        for (const friend of friends) {
            
            if (this.isOnline(friend)) { // if user's friend is online

                // send the friend a message that the user is offline
                const friendOnlineUser = this.getOnlineUserByUsername(friend)!;
                friendOnlineUser.sendJsonMessage(new SendPushNotificationMessage(
                    NotificationType.ERROR,
                    `${username} went offline.`
                ));
            }
        }

        // close the socket connection
        onlineUser.closeSocket(SocketCloseCode.NORMAL);

        // remove the user from the online pool
        this.onlineUsers.delete(username);
        console.log(`User ${username} disconnected.`);
    }

    // called when a message is received from a client
    public async onSocketMessage(ws: WebSocket, message: any) {

        // console.log(`Received message from ${this.getOnlineUserBySocket(ws)?.username}: ${message}`);

        const { type, data } = decodeMessage(message);
        const onlineUser = this.getOnlineUserBySocket(ws);

        if (!onlineUser) { // recieved message from socket not yet recognized as online user
            
            if (type === MessageType.JSON && (data as JsonMessage).type === JsonMessageType.ON_CONNECT) {
                // ON_CONNECT is the only message that can be received from an unrecognized socket
                // we convert the socket to an OnlineUser and add it to the online pool
                const userInfo = (data as OnConnectMessage);
                await this.onUserConnect(userInfo.username, ws);
            }
            else { // if the message is not ON_CONNECT, then client is not allowed to send messages until handshake is complete
                ws.send(JSON.stringify(new ErrorHandshakeIncompleteMessage()));
            }
        } else {
            // recieved message from socket recognized as online user
            try {
                await handleJsonMessage(this.state, onlineUser, data as JsonMessage);
            } catch (error: any) {
                console.error(error);
                onlineUser.sendJsonMessage(new ErrorMessage(error.toString()));
            }
            
        }
    }

    // called when a socket connection is closed
    public async onSocketClose(ws: WebSocket, code: number, reason: string) {

        console.log(`Socket closed with code ${code} and reason ${reason}`);

        const onlineUser = this.getOnlineUserBySocket(ws);
        if (onlineUser) {
            await this.onUserDisconnect(onlineUser.username);
            console.log(`So, user ${onlineUser.username} disconnected.`)
        }

        this.printOnlineUsers();
    }

    public printOnlineUsers() {
        console.log(`Online users: ${this.getOnlineUsernames()}`);
    }

}