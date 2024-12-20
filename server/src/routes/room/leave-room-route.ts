import { Authentication } from "../../../shared/models/db-user";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { RankedQueueConsumer } from "../../online-users/event-consumers/ranked-queue-consumer";
import { RoomConsumer } from "../../online-users/event-consumers/room-consumer";
import { PostRoute, RouteError, UserInfo } from "../route";

/**
 * Route for leaving the ranked queue
 */
export class LeaveRoomRoute extends PostRoute {
    route = "/api/v2/leave-room/:sessionid";
    authentication = Authentication.USER;

    override async post(userInfo: UserInfo | undefined, pathParams: any) {
        const sessionID = pathParams.sessionid as string;
        if (!sessionID) throw new RouteError(400, "Session ID is required");

        // Leave the room
        const success = await EventConsumerManager.getInstance().getConsumer(RoomConsumer).freeSession(userInfo!.userid, sessionID);
        return { success };
    }
}