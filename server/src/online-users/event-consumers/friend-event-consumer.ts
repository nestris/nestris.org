import { FriendOnlineStatusChangeMessage } from "../../../shared/network/json-messages/friend-online-status-change-message";
import { EventConsumer } from "../event-consumer";
import { OnUserConnectEvent, OnUserDisconnectEvent } from "../online-user-events";

export class FriendEventConsumer extends EventConsumer {

    protected async onUserConnect(event: OnUserConnectEvent) {
        await this.updateFriendsOnlineStatus(event.userid, event.username, true);
    }

    protected async onUserDisconnect(event: OnUserDisconnectEvent) {
        await this.updateFriendsOnlineStatus(event.userid, event.username, false);
    }

    // For each online friend, send them a message that the user is now online/offline
    private async updateFriendsOnlineStatus(userid: string, username: string, online: boolean) {
        const onlineFriends = await this.users.getOnlineFriends(userid);

        for (const friend of onlineFriends) {
            this.users.sendToUser(friend, new FriendOnlineStatusChangeMessage(
                userid, username, online
            ));
        }
    }
}