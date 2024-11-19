import { RoomState, RoomType } from "./room-models";

export interface MultiplayerRoomState extends RoomState {
    type: RoomType.MULTIPLAYER;
}

export interface XPDelta {
    xpGain: number;
    xpLoss: number;
}