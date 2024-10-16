import { JsonMessage, JsonMessageType } from "../json-message";

export class FriendOnlineStatusChangeMessage extends JsonMessage {
    constructor(
        public readonly userid: string, // userid of friend
        public readonly username: string, // username of friend
        public readonly online: boolean // true if friend is online, false if offline
    ) {
        super(JsonMessageType.FRIEND_ONLINE_STATUS_CHANGE)
    }
}