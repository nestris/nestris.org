import { Authentication, DBUser } from "../../../shared/models/db-user";
import { queryUserByUserID } from "../../database-old/user-queries";
import { EventConsumerManager } from "../../server-state/event-consumer";
import { GetRoute, RouteError, UserInfo } from "../route";

interface OnlineFriendCount {
    count: number;
}

/**
 * Route for getting the number of online friends the user has
 */
export class GetOnlineFriendCountRoute extends GetRoute<OnlineFriendCount> {
    route = "/api/v2/online-friend-count";
    authentication = Authentication.USER;

    async get(userInfo: UserInfo | undefined): Promise<OnlineFriendCount> {
        
        const friends = await EventConsumerManager.getInstance().getUsers().getOnlineFriends(userInfo!.userid);
        return { count: friends.length };
    }
}