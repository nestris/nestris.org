import { Authentication } from "../../../shared/models/db-user";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { RankedQueueConsumer } from "../../online-users/event-consumers/ranked-queue-consumer";
import { PostRoute, UserInfo } from "../route";

/**
 * Route for leaving the ranked queue
 */
export class LeaveRankedQueueRoute extends PostRoute {
    route = "/api/v2/leave-ranked-queue";
    authentication = Authentication.USER;

    override async post(userInfo: UserInfo | undefined) {

        // Leave the ranked queue
        await EventConsumerManager.getInstance().getConsumer(RankedQueueConsumer).leaveRankedQueue(userInfo!.userid);
        
        return {success: true};
    }
}