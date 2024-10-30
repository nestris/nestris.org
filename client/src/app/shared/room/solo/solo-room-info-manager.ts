import { RoomEvent, RoomInfo, RoomInfoManager } from "../room-models";

export interface SoloRoomInfo extends RoomInfo {

}

export interface SoloRoomEvent extends RoomEvent {
    
}

export class SoloRoomInfoManager extends RoomInfoManager<SoloRoomInfo, SoloRoomEvent> {

    constructor(roomInfo: SoloRoomInfo) {
        super(roomInfo);
    }

    onEvent(event: SoloRoomEvent): void {
        throw new Error("Method not implemented.");
    }

}