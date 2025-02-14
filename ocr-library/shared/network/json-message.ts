import { Challenge } from "../models/challenge"
import { DBUser } from "../models/db-user"
import { NotificationType } from "../models/notifications"
import { ClientRoomEvent, RoomInfo, RoomState } from "../room/room-models"
import { League } from "../nestris-org/league-system";
import { TrophyDelta, XPDelta } from "../room/multiplayer-room-models"
import { FriendInfo, FriendInfoUpdate } from "../models/friends";
import { Invitation, InvitationCancellationReason } from "../models/invitation";
import { QuestID } from "../nestris-org/quest-system";

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
    SEND_PUSH_NOTIFICATION = 'send_push_notification',
    FRIEND_UPDATE = 'friend_update',
    SERVER_RESTART_WARNING = 'server_restart_warning', // sent from server to client to warn of server restart
    ME = 'ME',
    CHAT = 'chat',
    SPECTATOR_COUNT = 'spectator_count',
    IN_ROOM_STATUS = 'in_room_status',
    ROOM_STATE_UPDATE = 'room_state_update',
    CLIENT_ROOM_EVENT = 'client_room_event',
    NUM_QUEUING_PLAYERS = 'num_queuing_players',
    FOUND_OPPONENT = 'found_opponent',
    REDIRECT = 'go_to_page',
    INVITATION = 'invitation',
    QUEST_COMPLETE = 'quest_complete',
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

// sent by client to server to check if connection is still alive. ms is the time in milliseconds. Server sends back same message with ms
export class PingMessage extends JsonMessage {
    constructor(
        public readonly ms: number
    ) {
        super(JsonMessageType.PING)
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



// sent from server to client to warn of server restart
export class ServerRestartWarningMessage extends JsonMessage {
    constructor(
        public readonly warning: boolean // whether enabled or disabled
    ) {
        super(JsonMessageType.SERVER_RESTART_WARNING)
    }
}

export class MeMessage extends JsonMessage {
    constructor(
        public readonly me: DBUser
    ) {
        super(JsonMessageType.ME)
    }
}

export class ChatMessage extends JsonMessage {
    constructor(
        public readonly username: string,
        public readonly message: string
    ) {
        super(JsonMessageType.CHAT)
    }
}


export enum InRoomStatus {
    PLAYER = 'player',
    SPECTATOR = 'spectator',
    NONE = 'none'
}

// Sent from server to client to indicate which room the client is in, if any
export class InRoomStatusMessage extends JsonMessage {
    constructor(
        public readonly status: InRoomStatus,
        public readonly roomInfo: RoomInfo | null,
        public readonly roomState: RoomState | null
    ) {
        super(JsonMessageType.IN_ROOM_STATUS)
    }
}


// sent from server to client to update the number of spectators in the room
export class SpectatorCountMessage extends JsonMessage {
    constructor(
        public readonly count: number
    ) {
        super(JsonMessageType.SPECTATOR_COUNT)
    }
}

// sent from server to client to update the type-specific state of a room
export class RoomStateUpdateMessage extends JsonMessage {
    constructor(
        public readonly state: RoomState
    ) {
        super(JsonMessageType.ROOM_STATE_UPDATE)
    }
}


// sent from client to server on a client-triggered room event
export class ClientRoomEventMessage extends JsonMessage {
    constructor(
        public readonly event: ClientRoomEvent
    ) {
        super(JsonMessageType.CLIENT_ROOM_EVENT)
    }
}

// sent from server to client to update the number of players queuing for multiplayer
export class NumQueuingPlayersMessage extends JsonMessage {
    constructor(
        public readonly count: number
    ) {
        super(JsonMessageType.NUM_QUEUING_PLAYERS)
    }
}

// sent from server to client to indicate that a match has been found
export class FoundOpponentMessage extends JsonMessage {
    constructor(
        public readonly opponentName: string,
        public readonly opponentTrophies: number,
        public readonly opponentLeague: League,
        public readonly trophyDelta: TrophyDelta,
    ) {
        super(JsonMessageType.FOUND_OPPONENT)
    }
}

// sent from server to client to navigate to a new page
export class RedirectMessage extends JsonMessage {
    constructor(
        public readonly route: string
    ) {
        super(JsonMessageType.REDIRECT)
    }
}

export interface FriendUpdateData {
    create?: FriendInfo, // if defined, creating a new friend
    update?: FriendInfoUpdate, // if defined, updating an existing friend's properties
} // if neither create nor update are defined, the friend is being removed

export class FriendUpdateMessage extends JsonMessage {
    constructor(
        public readonly userid: string, // userid of friend
        public readonly data: FriendUpdateData        
    ) {
        super(JsonMessageType.FRIEND_UPDATE)
    }
}

// Sent to create/accept/cancel a challenge
export enum InvitationMode {
    CREATE = 'create',
    ACCEPT = 'accept',
    CANCEL = 'cancel'
}
export class InvitationMessage extends JsonMessage {
    constructor(
        public readonly mode: InvitationMode,
        public readonly invitation: Invitation,
        public readonly cancelReason?: InvitationCancellationReason
    ) {
        super(JsonMessageType.INVITATION)
    }
}

export class QuestCompleteMessage extends JsonMessage {
    constructor(
        public readonly questID: QuestID
    ) {
        super(JsonMessageType.QUEST_COMPLETE)
    }
}