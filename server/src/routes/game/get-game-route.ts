import { DBGame } from "../../../shared/models/db-game";
import { Authentication } from "../../../shared/models/db-user";
import { SortOrder } from "../../../shared/models/query";
import { GetGameQuery } from "../../database/db-queries/get-game-query";
import { GetGamesQuery } from "../../database/db-queries/get-games-query";
import { Database } from "../../database/db-query";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { GetRoute, PostRoute, RouteError, UserInfo } from "../route";

/**
 * Route for getting a game by id, then sending the data over websocket to sessionid
 */
export class GetGameRoute extends PostRoute<DBGame> {
    route = "/api/v2/game/:gameid/:sessionid";
    authentication = Authentication.USER;

    override async post(userInfo: UserInfo | undefined, pathParams: any) {

        const gameid = pathParams.gameid;
        const sessionid = pathParams.sessionid;

        // Assert session is online
        const users = EventConsumerManager.getInstance().getUsers();
        if (!users.isSessionOnline(sessionid)) {
            throw new RouteError(400, `Session ${sessionid} is not online`);
        }

        // Get the game
        let game: DBGame;
        let data: Uint8Array | null;
        try {
            ({ game, data } = await Database.query(GetGameQuery, gameid));
        } catch (err) {
            throw new RouteError(400, `Error getting game ${gameid}: ${err}`);
        }

        if (!data) {
            console.log(`Game data not found for game ${gameid}`);
            throw new RouteError(410, `Game data not found for game ${gameid}`);
        }

        // Send the game data to the user's session over websocket
        console.log(`Sending game ${gameid} to session ${sessionid}`, data);
        users.sendToUserSession(sessionid, data);

        return game;
    }
}