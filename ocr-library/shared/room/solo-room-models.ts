import { RoomState, RoomType } from "./room-models";

export interface SoloRoomState extends RoomState {
    type: RoomType.SOLO;
}