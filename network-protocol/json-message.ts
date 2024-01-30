import { IActivePuzzleSchema } from "server/puzzles/puzzle-microservice-models"
import { FriendInfo, OnlineUserStatus } from "./models/friends"

/*
Data sent over websocket as JSON. type is the only required field and specifies
the type of message being sent. All other fields are optional and depend on the
type of message being sent.
*/
export enum JsonMessageType {
    ERROR_MESSAGE = 'error_message',
    ON_CONNECT = 'on_connect',
    CONNECTION_SUCCESSFUL = 'connection_successful',
    ERROR_HANDSHAKE_INCOMPLETE = 'error_handshake_incomplete',
    PING = 'ping',
    PONG = 'pong',
    FRIEND_ONLINE_STATUS_CHANGE = 'friend_online_status_change',
    BROADCAST_ANNOUNCEMENT = 'broadcast_announcement',
    SEND_FRIEND_REQUEST = 'send_friend_request',
    ON_SEND_FRIEND_REQUEST ='on_send_friend_request',
    ACCEPT_FRIEND_REQUEST = 'accept_friend_request',
    DECLINE_FRIEND_REQUEST = 'decline_friend_request',
    ON_FRIEND_REQUEST_ACCEPTED = 'on_friend_request_accepted',
    ON_FRIEND_REQUEST_DECLINED = 'on_friend_request_declined',
    FETCH_PUZZLE_REQUEST = 'fetch_puzzle_request',
    FETCH_PUZZLE_RESPONSE = 'fetch_puzzle_response'
}

export abstract class JsonMessage {
    constructor(
        public readonly type: JsonMessageType 
    ) {}
}

// SCHEMAS FOR EACH MESSAGE TYPE

// sent from server to client when an error occurs
export class ErrorMessage extends JsonMessage {
    constructor(
        public readonly error: string,
    ) {
        super(JsonMessageType.ERROR_MESSAGE)
    }
}

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
export class FriendOnlineStatusChange extends JsonMessage {
    constructor(
        public readonly friendUsername: string, // the user who's status changed
        public readonly status: OnlineUserStatus, // the new status
    ) {
        super(JsonMessageType.FRIEND_ONLINE_STATUS_CHANGE)
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

// sent from client to server when a user sends a friend request
// also sent from server to client when a user receives a friend request
export class SendFriendRequestMessage extends JsonMessage {
    constructor(
        public readonly potentialFriend: string,
    ) {
        super(JsonMessageType.SEND_FRIEND_REQUEST)
    }
}

// sent from server to client to confirm that the user sent a friend request
export class OnSendFriendRequestMessage extends JsonMessage {
    constructor(
        public readonly friendInfo: FriendInfo,
    ) {
        super(JsonMessageType.ON_SEND_FRIEND_REQUEST)
    }
}

// sent from client to server to accept friend request sent by another user
export class AcceptFriendRequestMessage extends JsonMessage {
    constructor(
        public readonly requesterUsername: string
    ) {
        super(JsonMessageType.ACCEPT_FRIEND_REQUEST)
    }
}

// sent from client to server to decline friend request sent by another user
export class DeclineFriendRequestMessage extends JsonMessage {
    constructor(
        public readonly requesterUsername: string
    ) {
        super(JsonMessageType.DECLINE_FRIEND_REQUEST)
    }
}

// sent from server to client when client gets a friend request accepted
export class OnFriendRequestAcceptedMessage extends JsonMessage {
    constructor(
        public readonly newFriend: string,
    ) {
        super(JsonMessageType.ON_FRIEND_REQUEST_ACCEPTED)
    }
}

// sent from server to client when client gets a friend request declined
export class OnFriendRequestDeclinedMessage extends JsonMessage {
    constructor(
        public readonly newFriend: string,
    ) {
        super(JsonMessageType.ON_FRIEND_REQUEST_DECLINED)
    }
}

// sent by client to server to request for a puzzle
export class FetchPuzzleRequestMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.FETCH_PUZZLE_REQUEST)
    }
}

// response by server to client with requested puzzle
export class FetchPuzzleResponseMessage extends JsonMessage {
    constructor(
        public readonly puzzle?: IActivePuzzleSchema,
        public readonly error?: string
    ) {
        super(JsonMessageType.FETCH_PUZZLE_RESPONSE)
    }
}