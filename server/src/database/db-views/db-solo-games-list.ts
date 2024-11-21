import { SoloGameInfo } from "../../../shared/room/solo-room-models";
import { Database, DBQuery } from "../db-query";
import { DBView } from "../db-view";

// Event when a new solo game is added to the list
export class DBSoloGamesListAddEvent {
    constructor(
        public readonly gameID: string,
        public readonly score: number,
        public readonly xp: number
    ) {}
}

/**
 * Gets the last 10 solo games played by a user.
 */
class DBSoloGamesListQuery extends DBQuery<SoloGameInfo[]> {
    public override query = `
        SELECT g.id, g.end_score, g.xp_gained
        FROM games g
        WHERE g.userid = $1
        AND NOT EXISTS (
            SELECT 1 
            FROM match_games mg 
            WHERE mg.game_id = g.id
        )
        ORDER BY g.created_at DESC
        LIMIT 10;
    `;

    public override warningMs = null;

    constructor(
        public readonly userID: string
    ) {
        super([userID]);
    }

    public override parseResult(resultRows: any[]): SoloGameInfo[] {
        return resultRows.map((row: any) => ({
            gameID: row.id,
            score: row.end_score,
            xp: row.xp_gained
        }));
    }
}


/**
 * Stores a view of the last N solo games played by each user.
 */
export class DBSoloGamesListView extends DBView<SoloGameInfo[], DBSoloGamesListAddEvent>("DBSoloGamesListView") {

    protected override async fetchViewFromDB(): Promise<SoloGameInfo[]> {

        return await Database.query(DBSoloGamesListQuery, this.id);
        
    }

    public override alterView(event: DBSoloGamesListAddEvent): void {
        
        // insert game to end of list, and remove the first game if the list is too long
        this.view.push({
            gameID: event.gameID,
            score: event.score,
            xp: event.xp
        });

        if (this.view.length > 10) {
            this.view.shift();
        };
    }

}