import { GameRecoverySchema } from "src/app/shared/network/stream-packets/packet";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import { GlobalState } from "../../global-state";
import { OCRFrame } from "../../ocr-frame";
import { StateEvent } from "../../ocr-state";
import { SingleFramePersistenceStrategy } from "../../persistence-strategy";
import { OCRStateID } from "../ocr-state-id";
import GameStatus from "src/app/shared/tetris/game-status";
import { SmartGameStatus } from "src/app/shared/tetris/smart-game-status";
import { GameLimboState } from "../states/game-limbo-state";

/**
 * RecoveryEvent optimistically transitions Limbo -> PieceDropping state. It attempts to find a frame where
 * board can be isolated and activePiece found, with valid level, lines, and score that is equal or greater than
 * current game status.
 */
export class RecoveryEvent extends StateEvent {
    public override readonly name: string = "RecoveryEvent";
    public override readonly persistence = new SingleFramePersistenceStrategy();

    protected previousSeperation: [MoveableTetromino, TetrisBoard] | null = null;

    protected recovery?: GameRecoverySchema;

    constructor(
        protected readonly globalState: GlobalState,
        protected readonly limboState?: GameLimboState
    )
    { super(); }

    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {

        let status: SmartGameStatus;
        if (this.limboState) status = new SmartGameStatus(
            this.globalState.game!.startLevel,
            this.limboState.predictedLines,
            this.limboState.predictedScore,
            this.limboState.predictedLevel
        );
        else { // For MidGameStart, we set status to default level 18
            const level = (await ocrFrame.getLevel())!;
            const lines = (await ocrFrame.getLines(false))!;
            const score = (await ocrFrame.getScore(false))!;
            if (level === -1 || lines === -1 || score === -1) return false;
            status = new SmartGameStatus(level, lines, score, level);
        }

        // Try to seperate board from active piece
        const previousSeperation = this.previousSeperation;
        const board = ocrFrame.getColorBoard(status.level)!;
        const seperation = board.seperateBoardAndPiece();
        this.previousSeperation = seperation;

        // If cannot seperate, cannot recover this frame
        if (!seperation) { console.log("no seperation"); return false; }

        // Need to have consecutive valid seperations
        if (!previousSeperation) { console.log("no previous seperation"); return false; }

        const [previousPiece, previousIsolatedBoard] = previousSeperation;
        const [currentPiece, currentIsolatedBoard] = seperation;

        // The active piece must be of the same type
        if (previousPiece.tetrominoType !== currentPiece.tetrominoType) {
            console.log("not same type seperation");
            return false;
        }

        // The active piece must have moved while isolated board stayed the same
        if (previousPiece.equals(currentPiece) || !previousIsolatedBoard.equalsIgnoreColor(currentIsolatedBoard)) {
            console.log("active not move or isolated board move");
            return false;
        }

        // Valid next piece
        const next = ocrFrame.getNextType()!;
        if (next === TetrominoType.ERROR_TYPE) {
            console.log("invalid next piece");
            return false;
        }

        // Score, level, and lines must be valid and at least the current values
        let score: number;
        if (status.score < 950000) {
            score = (await ocrFrame.getScore(false))!;
            if (score === -1 || score < status.score) return false;
        }
        
        this.recovery = {
            startLevel: status.startLevel,
            isolatedBoard: currentIsolatedBoard,
            current: currentPiece.tetrominoType,
            score: status.score,
            level: status.level,
            lines: status.lines,
            next,
            countdown: 0
        }

        return true;
    };

    /**
     * On successful recovery, go back to normal game state
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {

        // Recover game with current state
        this.globalState.game!.setRecovery(this.recovery!);

        // Transition back to normal piece drop
        return OCRStateID.PIECE_DROPPING;
    }

}