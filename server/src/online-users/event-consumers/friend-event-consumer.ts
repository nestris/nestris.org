import { FriendOnlineStatusChangeMessage } from "../../../shared/network/json-messages/friend-online-status-change-message";
import { DBObjectNotFoundError } from "../../database/db-object-error";
import { Database, DBQuery } from "../../database/db-query";
import { EventConsumer } from "../event-consumer";
import { OnUserConnectEvent, OnUserDisconnectEvent } from "../online-user-events";

// Gets the list of friend userids for a given user
class GetFriendsQuery extends DBQuery<string[]> {

    // Because friends are represented by a single row representing a mutual friendship, we need check both columns
    public override readonly query = `
        SELECT userid2 as userid
        FROM user_relationships
        WHERE userid1 = $1 AND type = 'friends'
        UNION
        SELECT userid1 as userid
        FROM user_relationships
        WHERE userid2 = $1 AND type = 'friends'
    `;

    public override readonly warningMs = null;

    constructor(userid: string) {
        super([userid]);
    }

    public override parseResult(resultRows: any[]): string[] {
        return resultRows.map((row) => row.userid);
    }
}

export class FriendEventConsumer extends EventConsumer {

    // On user connect, update the online status of all friends to online
    protected async onUserConnect(event: OnUserConnectEvent) {
        await this.updateFriendsOnlineStatus(event.userid, event.username, true);
    }

    // On user disconnect, update the online status of all friends to offline
    protected async onUserDisconnect(event: OnUserDisconnectEvent) {
        await this.updateFriendsOnlineStatus(event.userid, event.username, false);
    }

    // For each online friend, send them a message that the user is now online/offline
    private async updateFriendsOnlineStatus(userid: string, username: string, online: boolean) {
        
        // Get a list of all friend userids for the given user from the database
        let allFriendUserids: string[];
        try {
            allFriendUserids = await Database.query(GetFriendsQuery, userid);
        } catch (err: any) {
            // If user doesn't exist, it means it was a guest account that got deleted
            if (err instanceof DBObjectNotFoundError) return;

            throw err;
        }
        

        // For each friend, send a message that the user is now online/offline
        for (const friendID of allFriendUserids) {

            // If user is not online, don't send the message
            if (!this.users.isUserOnline(friendID)) continue;

            // Send message that the user is now online/offline
            this.users.sendToUser(friendID, new FriendOnlineStatusChangeMessage(
                userid, username, online
            ));
        }
    }
}