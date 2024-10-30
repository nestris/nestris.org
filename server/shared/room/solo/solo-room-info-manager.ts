import { RoomEvent, RoomInfo, RoomInfoManager, RoomType } from "../room-models";

export interface SoloRoomInfo extends RoomInfo {
    type: RoomType.SOLO;
}

export interface SoloRoomEvent extends RoomEvent {
    
}

export class SoloRoomInfoManager extends RoomInfoManager<SoloRoomInfo, SoloRoomEvent> {

    onEvent(event: SoloRoomEvent): void {
        throw new Error("Method not implemented.");
    }

}