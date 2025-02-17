import { Authentication } from "../../../shared/models/db-user";
import { GetScoreHistogramQuery } from "../../database/db-queries/get-score-histogram-query";
import { Database } from "../../database/db-query";
import { GetRoute, UserInfo } from "../route";

/**
 * Route for getting a histogram of scores for the logged in user
 */
export class GetScoreHistogramRoute extends GetRoute<number[]> {
    route = "/api/v2/score-histogram";
    authentication = Authentication.USER;

    override async get(userInfo: UserInfo | undefined) {  
        return await Database.query(GetScoreHistogramQuery, userInfo!.userid);
    }
}