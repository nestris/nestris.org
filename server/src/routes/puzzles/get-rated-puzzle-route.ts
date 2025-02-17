import { Authentication } from "../../../shared/models/db-user";
import { DBPuzzle } from "../../../shared/puzzles/db-puzzle";
import { RatedPuzzleResult } from "../../../shared/puzzles/rated-puzzle";
import { Database, DBQuery } from "../../database/db-query";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { RatedPuzzleConsumer } from "../../online-users/event-consumers/rated-puzzle-consumer";
import { GetRoute, RouteError, UserInfo } from "../route";

/**
 * Query to get a puzzle id from the database, if it exists
 */
class GetPuzzleQuery extends DBQuery<DBPuzzle | null> {
    public override query = `
        SELECT * FROM rated_puzzles WHERE id = $1
    `;
    public override warningMs = null;

    constructor(puzzleID: string) {
        super([puzzleID]);
    }

    public override parseResult(resultRows: any[]): DBPuzzle | null {
        if (resultRows.length === 0) return null;
        return resultRows[0] as DBPuzzle;
    }
}


/**
 * Route to get puzzle by id, or 404 error if does not exist
 */
export class GetRatedPuzzleRoute extends GetRoute<DBPuzzle> {
    route = "/api/v2/rated-puzzle/get/:id";

    override async get(userInfo: UserInfo | undefined, pathParams: any): Promise<DBPuzzle> {

        // A puzzleID that may or may not exist in the database
        const puzzleID = pathParams.id as string;

        let dbPuzzle: DBPuzzle | null;
        try {
            dbPuzzle = await Database.query(GetPuzzleQuery, puzzleID);
        } catch (error: any) {
            throw new RouteError(500, error.message);
        }

        if (dbPuzzle === null) throw new RouteError(404, `Puzzle ${puzzleID} does not exist`);
        return dbPuzzle;
    }
}