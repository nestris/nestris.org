import { EventConsumerManager } from "../../online-users/event-consumer";
import { RoomConsumer } from "../../online-users/event-consumers/room-consumer";
import { SoloRoom } from "../../room/solo-room";
import { GetRoute, UserInfo } from "../route";

/**
 * Route for getting the info for all the rooms
 */
export class GetRoomsRoute extends GetRoute {
    route = "/api/v2/rooms";

    override async get(userInfo: UserInfo | undefined) {  
        return EventConsumerManager.getInstance().getConsumer(RoomConsumer).getAllRoomInfo();
    }
}