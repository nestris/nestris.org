import { OnlineUserStatus } from "server/server-state/online-user";

/*
Data sent over websocket as JSON. type is the only required field and specifies
the type of message being sent. All other fields are optional and depend on the
type of message being sent.
*/
export enum JsonMessageType {
    // Client to server
    LOGIN = 'login',
    FRIEND_STATUS = 'friend_status',
}

export abstract class JsonMessage {
    constructor(
        public readonly type: JsonMessageType 
    ) {}
}

// schemas for each message type
export class LoginMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.LOGIN);
    }
}

export class FriendIsOnlineMessage extends JsonMessage {
    constructor(
        public readonly isOnline: boolean,
    ) {
        super(JsonMessageType.FRIEND_STATUS)
    }
}