import { Authentication } from "../../../shared/models/db-user";
import { RelativeLeaderboards } from "../../../shared/models/leaderboard";
import { FullHighscoreLeaderboard, FullPuzzlesLeaderboard, FullTrophiesLeaderboard } from "../../leaderboards/full-leaderboard";
import { LeaderboardManager } from "../../leaderboards/leaderboard-manager";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { RankedQueueConsumer } from "../../online-users/event-consumers/ranked-queue-consumer";
import { RoomConsumer } from "../../online-users/event-consumers/room-consumer";
import { MultiplayerRoom } from "../../room/multiplayer-room";
import { SoloRoom } from "../../room/solo-room";
import { GetRoute, UserInfo } from "../route";



/**
 * Route for getting the info for all the relative leaderboards for a user on the play page
 */
export class GetRelativeLeaderboardsRoute extends GetRoute<RelativeLeaderboards> {
    route = "/api/v2/leaderboard/relative";
    authentication = Authentication.USER;

    override async get(userInfo: UserInfo | undefined): Promise<RelativeLeaderboards> {
        const userid = userInfo!.userid;

        const queueConsumer = EventConsumerManager.getInstance().getConsumer(RankedQueueConsumer);
        const roomConsumer = EventConsumerManager.getInstance().getConsumer(RoomConsumer);
      
        const soloPlayingNow: number = roomConsumer.getRoomCount(room => room instanceof SoloRoom);
        const soloLeaderboard = LeaderboardManager.getFullLeaderboard(FullHighscoreLeaderboard).getLeaderboardForUser(userid);

        const inQueue = queueConsumer.playersInQueue();
        const rankedPlayingNow: number = 2 * roomConsumer.getRoomCount(room => room instanceof MultiplayerRoom && room.ranked);
        const rankedLeaderboard = LeaderboardManager.getFullLeaderboard(FullTrophiesLeaderboard).getLeaderboardForUser(userid);

        const puzzlesPlayingNow: number = 0;
        const puzzlesLeaderboard = LeaderboardManager.getFullLeaderboard(FullPuzzlesLeaderboard).getLeaderboardForUser(userid);

        return {
            solo: {
                playingNow: soloPlayingNow,
                leaderboard: soloLeaderboard
            },
            ranked: {
                playingNow: inQueue + rankedPlayingNow,
                leaderboard: rankedLeaderboard
            },
            puzzles: {
                playingNow: puzzlesPlayingNow,
                leaderboard: puzzlesLeaderboard
            }
        }
      }
}