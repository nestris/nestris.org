export enum RoomType {
    SOLO = 'SOLO',
}

// A RoomInfo is the information for a room, stored both server and client-side. They should be synced.
// Extend this interface additional info for specific room types
// RoomInfo does not contain information specific to a specific player in the room, but holds information common
// to all players in the room.
export interface RoomInfo {
    id: string; // room id
    type: RoomType; // room type
}

// A RoomEvent modifies a RoomInfo. The intent is for RoomInfo to only be modified server-side through a RoomEvent,
// which will be sent to clients to update their respective RoomInfo.
export interface RoomEvent {}

export abstract class RoomInfoManager<I extends RoomInfo, E extends RoomEvent> {
    protected roomInfo: I;

    constructor(roomInfo: I) {
        this.roomInfo = roomInfo;
    }

    public get(): I {
        return this.roomInfo;
    }

    // Apply an event to the room info
    public abstract onEvent(event: E): void;
}