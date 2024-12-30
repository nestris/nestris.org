import { GlobalStats } from "../../../shared/models/global-stat";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { GlobalStatConsumer } from "../../online-users/event-consumers/global-stat-consumer";
import { GetRoute, UserInfo } from "../route";

/**
 * Get all global stats from the GlobalStatConsumer
 */
export class GetGlobalStatRoute extends GetRoute<GlobalStats> {
    route = "/api/v2/global-stats";

    override async get(userInfo: UserInfo | undefined): Promise<GlobalStats> {
        return EventConsumerManager.getInstance().getConsumer(GlobalStatConsumer).getStats();
    }
}