import { T200LeaderboardData, T200LeaderboardType } from "../../../shared/models/leaderboard";
import { LeaderboardManager } from "../../leaderboards/leaderboard-manager";
import { GetRoute, RouteError, UserInfo } from "../route";



/**
 * Route for getting the info for all the relative leaderboards for a user on the play page
 */
export class GetT200LeaderboardRoute extends GetRoute<T200LeaderboardData> {
    route = "/api/v2/leaderboard/top/:type";

    override async get(userInfo: UserInfo | undefined, pathParams: any): Promise<T200LeaderboardData> {
        const type = pathParams.type as T200LeaderboardType;

        // Check if the type is valid
        if (!Object.values(T200LeaderboardType).includes(type)) {
            throw new Error('Invalid leaderboard type');
        }

        // Attempt to get the T200 leaderboard of the specified type
        try {
            return LeaderboardManager.getT200Leaderboard(type);
        } catch (err) {
            throw new RouteError(500, `Error getting ${type} leaderboard: ${err}`);
        }
      }
}