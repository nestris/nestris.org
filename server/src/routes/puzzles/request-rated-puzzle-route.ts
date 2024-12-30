import { Authentication } from "../../../shared/models/db-user";
import { UnsolvedRatedPuzzle } from "../../../shared/puzzles/rated-puzzle";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { RatedPuzzleConsumer } from "../../online-users/event-consumers/rated-puzzle-consumer";
import { PostRoute, RouteError, UserInfo } from "../route";

/**
 * Route for requesting a rated puzzle
 */
export class RequestRatedPuzzleRoute extends PostRoute<UnsolvedRatedPuzzle> {
    route = "/api/v2/rated-puzzle/request/:sessionid";
    authentication = Authentication.USER;

    override async post(userInfo: UserInfo | undefined, pathParams: any): Promise<UnsolvedRatedPuzzle> {
        const sessionID = pathParams.sessionid as string;

        const ecm = EventConsumerManager.getInstance();

        // Make sure sessionID corresponds to the user and is online
        if (!sessionID) throw new RouteError(400, "Session ID is required");
        if (ecm.getUsers().getUserIDBySessionID(sessionID) !== userInfo!.userid) {
            throw new RouteError(400, `Session ID ${sessionID} is not online or does not correspond to user ${userInfo!.username}`);
        }
        
        // Request a rated puzzle for the user
        try {
            const puzzle: UnsolvedRatedPuzzle | null =  await ecm.getConsumer(RatedPuzzleConsumer).requestRatedPuzzle(userInfo!.userid, sessionID);
            if (!puzzle) throw new RouteError(409, `User ${userInfo!.username} already has a rated puzzle in progress`);
            return puzzle;
        } catch (error: any) {
            throw new RouteError(500, error.message);
        }
    }
}