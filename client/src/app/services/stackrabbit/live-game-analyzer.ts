import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { StackrabbitService, TopMovesHybridResponse } from "./stackrabbit.service";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";

enum Mode {
    AWAITING_POSITION,
    AWAITING_PLACEMENT,
}

export interface Position {
    board: TetrisBoard,
    currentPiece: TetrominoType,
    nextPiece: TetrominoType,
    level: number,
    lines: number,
}

export class LiveGameAnalyzer {

    // An evaluation score for each piece placement in the game
    private readonly placementScores: number[] = [];

    private currentIndex: number = 0;
    private mode: Mode = Mode.AWAITING_POSITION;

    // A map of index to position for each pending position
    private pendingPositions: {[key: number]: Position} = {};

    constructor(
        private readonly stackrabbit: StackrabbitService 
    ) {}

    public onNewPosition(position: Position) {

        if (this.mode !== Mode.AWAITING_POSITION) throw new Error("Received position when not in position mode");

        //console.log("Received new position", position);

        this.mode = Mode.AWAITING_PLACEMENT;
        const index = this.currentIndex;
        this.pendingPositions[index] = position;
    }

    public async onPlacement(placement: MoveableTetromino) {

        if (this.mode !== Mode.AWAITING_PLACEMENT) throw new Error("Received placement when not in placement mode");

        //console.log("Received placement", placement);

        this.mode = Mode.AWAITING_POSITION;
        const index = this.currentIndex;
        this.currentIndex++;

        // Get the pending position and remove it from the map
        const position = this.pendingPositions[index];
        delete this.pendingPositions[index];

        // Create a copy of the board and apply the placement
        const secondBoard = position.board.copy();
        placement.blitToBoard(secondBoard);
        secondBoard.processLineClears();

        //console.log("first board");
        //position.board.print();
        //console.log("second board");
        //secondBoard.print();

        // Get the rating of the move
        const rateMove = await this.stackrabbit.rateMove(Object.assign(position, { secondBoard }));
        console.log("rateMove", rateMove);
    }
}