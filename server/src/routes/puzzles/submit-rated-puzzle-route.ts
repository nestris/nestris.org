import { Authentication } from "../../../shared/models/db-user";
import { DBPuzzle } from "../../../shared/puzzles/db-puzzle";
import { RatedPuzzleResult, RatedPuzzleSubmission } from "../../../shared/puzzles/rated-puzzle";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { RatedPuzzleConsumer } from "../../online-users/event-consumers/rated-puzzle-consumer";
import { PostRoute, RouteError, UserInfo } from "../route";

/**
 * Route for submitting a rated puzzle. POST body should be a RatedPuzzleSubmission
 */
export class SubmitRatedPuzzleRoute extends PostRoute<RatedPuzzleResult> {
    route = "/api/v2/rated-puzzle/submit";
    authentication = Authentication.USER;

    override async post(userInfo: UserInfo | undefined, _p: any, _q: any, bodyParams: {} ): Promise<RatedPuzzleResult> {

        const submission = bodyParams as RatedPuzzleSubmission;
        if (!submission.puzzleID) throw new RouteError(400, "Puzzle ID is required");        
        if (typeof submission.seconds !== "number" || submission.seconds < 0) throw new RouteError(400, "Seconds must be a nonnegative number");

        try {
            return await EventConsumerManager.getInstance().getConsumer(RatedPuzzleConsumer).submitRatedPuzzle(userInfo!.userid, submission);
        } catch (error: any) {
            throw new RouteError(500, error.message);
        }
    }
}