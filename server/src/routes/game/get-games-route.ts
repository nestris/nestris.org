import { DBGame } from "../../../shared/models/db-game";
import { SortOrder } from "../../../shared/models/query";
import { GetGamesQuery } from "../../database/db-queries/get-games-query";
import { Database } from "../../database/db-query";
import { GetRoute, RouteError, UserInfo } from "../route";

/**
 * Route for getting a list of game sorted and limited by the given parameters
 */
export class GetGamesRoute extends GetRoute<DBGame[]> {
    route = "/api/v2/games/:userid/:sortKey/:sortOrder/:limit";

    override async get(userInfo: UserInfo | undefined, pathParams: any) {

        const userid = pathParams.userid;
        const sortKey = pathParams.sortKey;
        const sortOrder = pathParams.sortOrder as SortOrder;
        const limit = parseInt(pathParams.limit);

        try {
            return await Database.query(GetGamesQuery, userid, sortKey, sortOrder, limit);
        } catch (e: any) {
            throw new RouteError(400, `Failed to get games: ${e.message}`);
        }

    }
}