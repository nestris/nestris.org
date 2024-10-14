import { JsonMessage } from "../../shared/network/json-message";


export class User {
    constructor(
        public readonly userid: string,
        public readonly username: string,
    ) { }
}

export class UserSession {

    // the room the client is currently viewing
    private clientRoom: Room | null = null;

    constructor(
        public readonly sessionID: string,
        public readonly socket: WebSocket,
    ) { }

    // Called only by WebsocketManager when client sends a message to this session
    _onMessage(message: JsonMessage) {

    }

    registerMessageHandler() {

    }
}


function onUserSessionOffline(session: UserSession) {

}


export abstract class Room {

    constructor(
        public readonly roomID: string,
        public readonly players: UserSession[],
    ) { }

}

export class RoomManager {

    // map of roomID to room
    private rooms = new Map<string, Room>();

}

export class WebsocketManager {



}