import { RoomEvent, RoomInfo, RoomInfoManager, RoomType } from "./room-models";
import { SoloRoomInfoManager } from "./solo/solo-room-info-manager";

export class RoomInfoManagerFactory {

    static create(roomInfo: RoomInfo): RoomInfoManager<RoomInfo, RoomEvent> {

        switch (roomInfo.type) {
            case RoomType.SOLO: return new SoloRoomInfoManager(roomInfo);
        }

    }

}