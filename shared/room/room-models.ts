export enum RoomType {
    SOLO = 'SOLO',
    MULTIPLAYER = 'MULTIPLAYER',
}

export interface RoomPlayer {
    userid: string;
    sessionID: string;
    username: string;
}

// A RoomInfo is the information for a room, stored both server and client-side. They should be synced.
// RoomInfo does not contain information specific to a specific player in the room, but holds information common
// to all players in the room.
export interface RoomInfo {
    id: string; // room id
    players: RoomPlayer[];
}

// Extend this interface for specific room info dependent on the room type
export interface RoomState {
    type: RoomType;
}

// A ClientRoomEvent is an clientside-triggered event by a session in a room, to be sent to the server.
export interface ClientRoomEvent {
    type: string; // The type of the event, to be defined by the specific room type
}