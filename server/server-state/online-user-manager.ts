import { getUserByUsername } from "server/database/user/user-service";
import { OnlineUser, OnlineUserStatus } from "./online-user";
import { FriendIsOnlineMessage as FriendOnlineMessage } from "network-protocol/json-message";

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

    public getOnlineUser(username: string): OnlineUser | undefined {
        return this.onlineUsers.get(username);
    }

    public isOnline(username: string): boolean {
        return this.onlineUsers.has(username);
    }

    // on user connect, add to online pool, and update friends' online friends
    // precondition: user already exists in database and is not already online
    public async onUserConnect(username: string, socket: WebSocket) {

        // get the user's friends from the database
        const user = (await getUserByUsername(username))!;

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
                const friendOnlineUser = this.getOnlineUser(friend)!;
                friendOnlineUser.onlineFriends.add(username);

                // send the friend a message that the user is online
                friendOnlineUser.sendJsonMessage(new FriendOnlineMessage(true));
            }
        }
    }

    // on user disconnect, remove from online pool, and update friends' online friends
    public onUserDisconnect(username: string) {

        // remove the user from the online pool
        const onlineUser = this.onlineUsers.get(username)!;
        this.onlineUsers.delete(username);

        // update the online friends of the user's friends
        for (const friend of onlineUser.friends) {
            
            if (this.isOnline(friend)) { // if user's friend is online

                // remove the user from the friend's online friends
                const friendOnlineUser = this.getOnlineUser(friend)!;
                friendOnlineUser.onlineFriends.delete(username);

                // send the friend a message that the user is offline
                friendOnlineUser.sendJsonMessage(new FriendOnlineMessage(false));
            }
        }
    }

}