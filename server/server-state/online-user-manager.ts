import { createUser, getUserByUsername } from "../database/user/user-service";
import { OnlineUser, OnlineUserStatus, SocketCloseCode } from "./online-user";
import { FriendIsOnlineMessage as FriendOnlineMessage, JsonMessage, JsonMessageType, OnConnectMessage } from "../../network-protocol/json-message";
import { MessageType, decodeMessage } from "../../network-protocol/ws-message";

/*
Manages the users that are online right now and thus are connected to socket with websocket
*/
export class OnlineUserManager {

    // map of username to OnlineUser
    private onlineUsers: Map<string, OnlineUser> = new Map<string, OnlineUser>();

    constructor() {}

    public getOnlineUsernames(): string[] {
        return Array.from(this.onlineUsers.keys());
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

    // on user connect, add to online pool, and update friends' online friends
    // if user does not exist, add user to database
    // if user is already online, refuse connection
    public async onUserConnect(username: string, gmail: string, socket: WebSocket) {

        console.log(`User ${username} attempting to connect.`);

        // if user is already online, refuse connection
        if (this.isOnline(username)) {
            console.log(`User ${username} is already online, refusing connection.`);
            (new OnlineUser(username, socket, [])).closeSocket(SocketCloseCode.ALREADY_LOGGED_IN);
            return;
        }

        // get the user's friends from the database
        let user = (await getUserByUsername(username));

        // if user does not exist, add user to database
        if (!user) {
            console.log(`User ${username} does not exist, creating new user.`);
            try {
                user = await createUser(username, gmail);
            } catch (error) {
                (new OnlineUser(username, socket, [])).closeSocket(SocketCloseCode.NEW_USER_DUPLICATE_INFO);
                return;
            }
        }

        // verify that the user's gmail is correct
        if (user.gmail !== gmail) {
            (new OnlineUser(username, socket, [])).closeSocket(SocketCloseCode.EMAIL_MISMATCH);
            return;
        }

        console.log(`User ${username} connected.`);

        // create a new OnlineUser
        const onlineUser = new OnlineUser(username, socket, user.friends);

        // add the user to the online pool
        this.onlineUsers.set(username, onlineUser);

        // update the online friends of the user's friends
        for (const friend of onlineUser.friends) {
            
            if (this.isOnline(friend)) { // if user's friend is online

                // add the friend to the user's online friends
                onlineUser.onlineFriends.add(friend);

                // add the user to the friend's online friends
                const friendOnlineUser = this.getOnlineUserByUsername(friend)!;
                friendOnlineUser.onlineFriends.add(username);

                // send the friend a message that the user is online
                friendOnlineUser.sendJsonMessage(new FriendOnlineMessage(true));
            }
        }
    }

    // on user disconnect, remove from online pool, and update friends' online friends
    public onUserDisconnect(username: string) {
        const onlineUser = this.onlineUsers.get(username)!;

        // update the online friends of the user's friends
        for (const friend of onlineUser.friends) {
            
            if (this.isOnline(friend)) { // if user's friend is online

                // remove the user from the friend's online friends
                const friendOnlineUser = this.getOnlineUserByUsername(friend)!;
                friendOnlineUser.onlineFriends.delete(username);

                // send the friend a message that the user is offline
                friendOnlineUser.sendJsonMessage(new FriendOnlineMessage(false));
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

        console.log(`Received message from ${this.getOnlineUserBySocket(ws)?.username}: ${message}`);

        const { type, data } = decodeMessage(message);
        const onlineUser = this.getOnlineUserBySocket(ws);

        if (!onlineUser) { // recieved message from socket not yet recognized as online user
            
            if (type === MessageType.JSON && (data as JsonMessage).type === JsonMessageType.ON_CONNECT) {
                // ON_CONNECT is the only message that can be received from an unrecognized socket
                // we convert the socket to an OnlineUser and add it to the online pool
                const userInfo = (data as OnConnectMessage);
                await this.onUserConnect(userInfo.username, userInfo.gmail, ws);
            }
        } else {
            // recieved message from socket recognized as online user
            // TODO: handle messages from client
        }

        this.printOnlineUsers();
    }

    // called when a socket connection is closed
    public async onSocketClose(ws: WebSocket, code: number, reason: string) {

        console.log(`Socket closed with code ${code} and reason ${reason}`);

        const onlineUser = this.getOnlineUserBySocket(ws);
        if (onlineUser) {
            this.onUserDisconnect(onlineUser.username);
            console.log(`So, user ${onlineUser.username} disconnected.`)
        }

        this.printOnlineUsers();
    }

    public printOnlineUsers() {
        console.log(`Online users: ${this.getOnlineUsernames()}`);
    }

}