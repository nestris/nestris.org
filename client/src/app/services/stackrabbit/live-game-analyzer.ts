import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { StackrabbitService, TopMovesHybridResponse } from "./stackrabbit.service";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";
import { SmartGameStatus } from "src/app/shared/tetris/smart-game-status";
import { calculatePlacementScore } from "src/app/shared/evaluation/evaluation";
import { PlatformInterfaceService } from "../platform-interface.service";
import { StackRabbitPlacementPacket } from "src/app/shared/network/stream-packets/packet";
import { Subject } from "rxjs";

enum Mode {
    AWAITING_POSITION,
    AWAITING_PLACEMENT,
}

export interface PlacementEvaluation {
    bestPlacementScore: number,
    playerPlacementScore: number,
    info?: string,
}

export interface Position {
    board: TetrisBoard,
    currentPiece: TetrominoType,
    nextPiece: TetrominoType,
    level: number,
    lines: number,
}

export class LiveGameAnalyzer {

    // An evaluation score for each piece placement in the game. The server holds the source of truth for
    // all the scores, but we also store them client-side for client-side in-game display.
    private readonly placementScores: number[] = [];

    private currentIndex: number = 0;
    private mode: Mode = Mode.AWAITING_POSITION;

    // A map of index to position for each pending position
    private pendingPositions: {[key: number]: Position} = {};

    // A map of index to promise for each topMovesHybrid request
    private topMovesPromises: {[key: number]: Promise<TopMovesHybridResponse | null>} = {};

    private stopAnalyzing: boolean = false;

    private placementEvaluation$ = new Subject<PlacementEvaluation>();

    constructor(
        private readonly stackrabbit: StackrabbitService, // For making Stackrabbit API calls
        private readonly platform: PlatformInterfaceService | null, // For sending placement accuracy scores to the server
        private readonly startLevel: number,
    ) {}

    public destroy() {
        this.placementEvaluation$.complete();
    }

    public onPlacementEvaluation(callback: (evaluation: PlacementEvaluation) => void) {
        this.placementEvaluation$.subscribe(callback);
    }

    public onNewPosition(position: Position) {

        // Stop analyzing after reaching level 29 for non-29-start games
        if (this.startLevel < 29 && position.level >= 29) {
            this.stopAnalysis();
            console.log("Stopping analysis for this game because level 29 was reached");
        }

        if (this.stopAnalyzing) return;

        if (this.mode !== Mode.AWAITING_POSITION) throw new Error("Received position when not in position mode");

        // Set the mode to awaiting placement and store the position
        this.mode = Mode.AWAITING_PLACEMENT;
        const index = this.currentIndex;
        this.pendingPositions[index] = position;

        // Get the top moves hybrid for the position
        this.topMovesPromises[index] = this.stackrabbit.getTopMovesHybrid({
            board: position.board,
            currentPiece: position.currentPiece,
            nextPiece: position.nextPiece,
            level: position.level,
            lines: position.lines,
            playoutDepth: 2,
        }).catch(e => {
            console.error("Error getting top moves hybrid", e);
            return null;
        });

    }

    public async onPlacement(placement: MoveableTetromino) {

        if (this.stopAnalyzing) return;

        if (this.mode !== Mode.AWAITING_PLACEMENT) throw new Error("Received placement when not in placement mode");

        // Set the mode back to awaiting position
        this.mode = Mode.AWAITING_POSITION;
        const index = this.currentIndex;
        this.currentIndex++;

        // Get the pending position and remove it from the map
        const position = this.pendingPositions[index];
        delete this.pendingPositions[index];

        // Get the topMovesHybrid response for the current position and remove it from the map
        const topMovesHybrid = await this.topMovesPromises[index];
        if (!topMovesHybrid) throw new Error("No topMovesHybrid response for index " + index);
        delete this.topMovesPromises[index];        

        // Create a copy of the board and apply the placement
        const secondBoard = position.board.copy();
        placement.blitToBoard(secondBoard);
        secondBoard.processLineClears();

        // Get evaluation for best and player placements
        let response: PlacementEvaluation;
        try {
            const start = new Date().getTime();
            response = await this.ratePlacement(position, topMovesHybrid, placement);
            const time = new Date().getTime() - start;
            console.log(JSON.stringify(response, null, 2), `Time: ${time}ms`);
            this.placementEvaluation$.next(response);
        } catch (e) {
            // If an error occurs, do not rate the placement
            console.error(`Error rating placement ${index}`, e);
            return;
        }

        // Do not rate placement if the stopAnalyzing flag was set while rating
        if (this.stopAnalyzing) {
            console.log("Game stopped, not rating placement with index", index);
            return;
        }

        // Calculate accuracy score of the placement and add it to the list of scores
        const accuracyScore = calculatePlacementScore(response.bestPlacementScore, response.playerPlacementScore);
        this.placementScores.push(accuracyScore);
        console.log("PLACEMENT SCORE:", accuracyScore);

        // Send the accuracy score to the server
        if (this.platform) this.platform.sendPacket(new StackRabbitPlacementPacket().toBinaryEncoder({ accuracyScore }));
    }

    /**
     * Prevent further placements from being rated and lock in the overall accuracy.
     */
    public stopAnalysis() {
        this.stopAnalyzing = true;
    }

    /**
     * Get the overall accuracy of the player's placements.
     * @returns A number between 0 and 1 representing the overall accuracy
     */
    public getOverallAccuracy(): number {
        // Return 0 if no placements have been rated
        if (this.placementScores.length === 0) return 0;

        return this.placementScores.reduce((a, b) => a + b) / this.placementScores.length;
    }

    /**
     * Get the evaluation of the best placement and the player's placement.
     * @param position The position before the player's placement
     * @param topMovesHybrid The best moves for the position precomputed before the player's placement
     * @param placement The player's placement
     */
    private async ratePlacement(position: Position, topMovesHybrid: TopMovesHybridResponse, placement: MoveableTetromino): Promise<PlacementEvaluation> {

        if (!topMovesHybrid.nextBox) {
            console.error(JSON.stringify(topMovesHybrid, null, 2));
            throw new Error("TopMovesHybrid response does not contain nextBox");
        }
        /**
         * Plan A: Locate player move within topMovesHybrid response to get precomputed evaluations.
         */
        for (let topPlacementPair of topMovesHybrid.nextBox) {
            if (topPlacementPair.firstPlacement.equals(placement)) {
                return {
                    bestPlacementScore: topMovesHybrid.nextBox[0].score, // Score of the best move for the position
                    playerPlacementScore: topPlacementPair.score, // Score of the player's placement
                    info: "PLAN A: Found player move in precomputed topMovesHybrid response"
                }
            }
        }

        /**
         * Plan B: Use rate-move endpoint to get evaluations for the player's placement and the best placement.
         */

        // Get the resulting board after placement
        const secondBoard = position.board.copy();
        placement.blitToBoard(secondBoard);
        const numLineClears = secondBoard.processLineClears();

        // // Attempt to use rateMove endpoint
        // try {
        //     const rateMove = await this.stackrabbit.rateMove(Object.assign({}, position, { secondBoard, playoutDepth: 2 }));
        //     return {
        //         bestPlacementScore: rateMove.bestMoveNB, // rate-move's evaluation of the best move for the position
        //         playerPlacementScore: rateMove.playerMoveNB, // rate-move's evaluation of the player's placement
        //         info: "PLAN B: Found player move using rateMove"
        //     };
        // } catch {} // Go to Plan C if rateMove fails

        /**
         * Plan C: Use topMovesHybrid on resulting board after player placement if rateMove fails.
         */

        // Calculate the updated level and lines after the line clears, using SmartGameStatus to handle transitions
        const status = new SmartGameStatus(this.startLevel, position.lines, 0, position.level);
        status.onLineClear(numLineClears);


        // Try to use topMovesHybrid on resulting board as backup
        try {

            const topMovesHybridAfterPlacement = await this.stackrabbit.getTopMovesHybrid({
                board: secondBoard, // the board after the player's placement
                currentPiece: position.nextPiece, // the nextbox piece while the player is placing the current piece
                nextPiece: null, // NNB because we don't know the next next piece after the player's placement
                level: status.level,
                lines: status.lines,
                playoutDepth: 2,
            });
    
            return {
                bestPlacementScore: topMovesHybrid.nextBox[0].score, // The precomputed best move's evaluation for the position
                playerPlacementScore: topMovesHybridAfterPlacement.noNextBox[0].score, // The evaluation of the best move after the player's placement
                info: "PLAN C: Found player move in backup topMovesHybrid response after player placement"
            };
        } catch (e) {
            throw new Error("Cannot rate move for position");
        }
    }
}