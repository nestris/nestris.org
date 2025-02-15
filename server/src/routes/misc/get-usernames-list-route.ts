import { FullHighscoreLeaderboard } from "../../leaderboards/full-leaderboard";
import { LeaderboardManager } from "../../leaderboards/leaderboard-manager";
import { GetRoute, UserInfo } from "../route";

/**
 * Route for getting a list of usernames given a search pattern
 */
export class GetUsernamesListRoute extends GetRoute<{userid: string, username: string}[]> {
    route = "/api/v2/usernames-list/:pattern?";

    override async get(userInfo: UserInfo | undefined, pathParams: any) {
        
        // The pattern to search for
        const pattern: string = (pathParams.pattern as string) ?? "";

        // Get the usernames matching the pattern
        return LeaderboardManager.getFullLeaderboard(FullHighscoreLeaderboard).getNonGuestUsernamesMatchingPattern(pattern, 50);
    }
}