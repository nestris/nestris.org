import { EventConsumerManager } from "../../online-users/event-consumer";
import { GetRoute, UserInfo } from "../route";

/**
 * Route for getting a list of all online users and their information
 */
export class GetOnlineUsersRoute extends GetRoute<any[]> {
    route = "/api/v2/online-users";

    async get(userInfo: UserInfo | undefined): Promise<any[]> {
        const users = EventConsumerManager.getInstance().getUsers();

        const userids = users.getAllOnlineUserIDs();
        return userids.map(userid => users.getUserInfo(userid));
    }
}