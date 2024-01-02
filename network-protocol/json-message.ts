import { OnlineUserStatus } from "server/server-state/online-user";

/*
Data sent over websocket as JSON. type is the only required field and specifies
the type of message being sent. All other fields are optional and depend on the
type of message being sent.
*/
export enum JsonMessageType {
    ON_CONNECT = 'on_connect',
    CONNECTION_SUCCESSFUL = 'connection_successful',
    ERROR_HANDSHAKE_INCOMPLETE = 'error_handshake_incomplete',
    PING = 'ping',
    PONG = 'pong',
    FRIEND_STATUS = 'friend_status',
    BROADCAST_ANNOUNCEMENT = 'broadcast_announcement',
}

export abstract class JsonMessage {
    constructor(
        public readonly type: JsonMessageType 
    ) {}
}

// SCHEMAS FOR EACH MESSAGE TYPE

// sent as initial message from client to server when user connects
export class OnConnectMessage extends JsonMessage {
    constructor(
        public readonly username: string,
        public readonly gmail: string,
    ) {
        super(JsonMessageType.ON_CONNECT)
    }
}

// send as response to OnConnectMessage to indicate successful connection
// if not successful, no message is sent but the socket is closed with error code instead
export class ConnectionSuccessfulMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.CONNECTION_SUCCESSFUL)
    }
}

// sent from server to client when client attempts to make a request when handshake is not complete
export class ErrorHandshakeIncompleteMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.ERROR_HANDSHAKE_INCOMPLETE)
    }
}

// sent by client to server to check if connection is still alive
export class PingMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.PING)
    }
}

// sent by server to client in response to PingMessage
export class PongMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.PONG)
    }
}

// sent when a friend comes online or goes offline
export class FriendIsOnlineMessage extends JsonMessage {
    constructor(
        public readonly isOnline: boolean,
    ) {
        super(JsonMessageType.FRIEND_STATUS)
    }
}

// sent when an announcement is broadcasted to all online users
export class BroadcastAnnouncementMessage extends JsonMessage {
    constructor(
        public readonly announcement: string,
    ) {
        super(JsonMessageType.BROADCAST_ANNOUNCEMENT)
    }
}