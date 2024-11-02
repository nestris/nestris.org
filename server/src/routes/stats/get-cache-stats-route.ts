import { Authentication } from "../../../shared/models/db-user";
import { FriendInfo, FriendStatus } from "../../../shared/models/friends";
import { getLeagueFromIndex, League } from "../../../shared/nestris-org/league-system";
import { DBCacheMonitor } from "../../database/db-cache-monitor";
import { Database, DBQuery } from "../../database/db-query";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { GetRoute, UserInfo } from "../route";

/**
 * Route for getting all the database cache stats since server start
 */
export class GetCacheStatsRoute extends GetRoute {
  route = "/api/v2/cache-stats";

  override async get(userInfo: UserInfo | undefined) {
    return DBCacheMonitor.getAllCacheMonitorResults();
  }
}