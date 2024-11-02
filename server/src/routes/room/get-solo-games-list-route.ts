import { Authentication } from "../../../shared/models/db-user";
import { DBSoloGamesList } from "../../../shared/room/solo-room-models";
import { DBSoloGamesListView } from "../../database/db-views/db-solo-games-list";
import { GetRoute, UserInfo } from "../route";

/**
 * Route for getting the last few solo games played by a user
 */
export class GetSoloGamesListRoute extends GetRoute<DBSoloGamesList> {
    route = "/api/v2/solo-games-list";
    authentication = Authentication.USER;

    override async get(userInfo: UserInfo | undefined): Promise<DBSoloGamesList> {
        
        const userid = userInfo!.userid;

        // Get the last 10 solo games played by the user
        return (await DBSoloGamesListView.get(userid)).view;
    }
}