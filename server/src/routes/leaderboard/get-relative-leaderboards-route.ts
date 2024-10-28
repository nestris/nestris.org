import { Authentication } from "../../../shared/models/db-user";
import { RelativeLeaderboards } from "../../../shared/models/leaderboard";
import { FullHighscoreLeaderboard, FullPuzzlesLeaderboard, FullTrophiesLeaderboard } from "../../leaderboards/full-leaderboard";
import { LeaderboardManager } from "../../leaderboards/leaderboard-manager";
import { GetRoute, UserInfo } from "../route";



/**
 * Route for getting the info for all the relative leaderboards for a user on the play page
 */
export class GetRelativeLeaderboardsRoute extends GetRoute<RelativeLeaderboards> {
    route = "/api/v2/relative-leaderboards";
    authentication = Authentication.USER;

    override async get(userInfo: UserInfo | undefined): Promise<RelativeLeaderboards> {

        const userid = userInfo!.userid;
      
        const soloPlayingNow: number = 0;
        const soloLeaderboard = LeaderboardManager.getFullLeaderboard(FullHighscoreLeaderboard).getLeaderboardForUser(userid);

        const rankedPlayingNow: number = 0;
        const rankedLeaderboard = LeaderboardManager.getFullLeaderboard(FullTrophiesLeaderboard).getLeaderboardForUser(userid);

        const puzzlesPlayingNow: number = 0;
        const puzzlesLeaderboard = LeaderboardManager.getFullLeaderboard(FullPuzzlesLeaderboard).getLeaderboardForUser(userid);

        return {
            solo: {
                playingNow: soloPlayingNow,
                leaderboard: soloLeaderboard
            },
            ranked: {
                playingNow: rankedPlayingNow,
                leaderboard: rankedLeaderboard
            },
            puzzles: {
                playingNow: puzzlesPlayingNow,
                leaderboard: puzzlesLeaderboard
            }
        }
      }
}