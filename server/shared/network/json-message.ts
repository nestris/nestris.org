import { NotificationType } from "../models/notifications"

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
    SEND_PUSH_NOTIFICATION = 'send_push_notification',
    UPDATE_FRIENDS_BADGE = 'update_friends', // adds the red badge to the friends icon
    UPDATE_ONLINE_FRIENDS = 'update_online_friends', // refreshes friends page
    START_SOLO_ROOM = 'start_solo_room',
    START_SPECTATE_ROOM = 'start_spectate_room',
    REQUEST_RECOVERY_PACKET = 'request_recovery_packet', // sent from server to client to request FullRecovery packet
    GO_TO_ROOM = 'go_to_room', // sent from server to client to navigate to a room
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
        public readonly userid: string,
        public readonly username: string,
        public readonly sessionID: string,
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


// sent from server to client to send push notification
export class SendPushNotificationMessage extends JsonMessage {
    constructor(
        public readonly notificationType: NotificationType,
        public readonly message: string,
    ) {
        super(JsonMessageType.SEND_PUSH_NOTIFICATION)
    }
}

// message to client that adds the red badge to the friends icon
export class UpdateFriendsBadgeMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.UPDATE_FRIENDS_BADGE)
    }
}

export class UpdateOnlineFriendsMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.UPDATE_ONLINE_FRIENDS)
    }
}

export class StartSoloRoomMessage extends JsonMessage {
    constructor(
        public readonly id: string,
        public readonly success: boolean = true,
        public readonly roomID?: string
    ) {
        super(JsonMessageType.START_SOLO_ROOM)
    }
}

// Sent by a client who wants to spectate the room. specify the room id to spectate
// the socket that sends this message will be added to the room as a spectator
export class StartSpectateRoomMessage extends JsonMessage {
    constructor(
        public readonly roomID: string
    ) {
        super(JsonMessageType.START_SPECTATE_ROOM)
    }
}

// sent from server to client to request a FullRecovery packet
export class RequestRecoveryPacketMessage extends JsonMessage {
    constructor() {
        super(JsonMessageType.REQUEST_RECOVERY_PACKET)
    }
}

// sent from server to client to navigate to a room
export class GoToRoomMessage extends JsonMessage {
    constructor(
        public readonly roomID: string
    ) {
        super(JsonMessageType.GO_TO_ROOM)
    }
}