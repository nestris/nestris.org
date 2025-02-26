import { StateEvent } from "../../ocr-state";
import { PieceDroppingState } from "./during-game-state";
import { TimedPersistenceStrategy } from "../../../state-machine/persistence-strategy";
import { OCRFrame } from "../../../state-machine/ocr-frame";
import { ALL_TETROMINO_TYPES, TetrominoType } from "../../../../shared/tetris/tetromino-type";
import MoveableTetromino from "../../../../shared/tetris/moveable-tetromino";
import { OCRStateID } from "../ocr-state-id";

/**
 * Event that triggers when a new piece is spawned without a line clear. This should result in the previous
 * piece being placed, and updating the stable board to reflect the placed piece.
 */
export class TopoutEvent extends StateEvent {
    public override readonly name = "TopoutEvent";
    public override readonly persistence = new TimedPersistenceStrategy(500);

    constructor(
        private readonly myState: PieceDroppingState,
    ) { super(); }

    /**
     * Precondition is when the spawn position of one of the seven pieces has been filled by minos, and no
     * active piece is detected
     */
    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {

        // An active piece means no topout
        if (this.myState.getActivePieceThisFrame()) return false;

        const board = ocrFrame.getBinaryBoard()!;

        // Whether the board contains piece of given type in spawn position
        const pieceSpawnFilled = (type: TetrominoType): boolean => {
            for (let block of MoveableTetromino.fromSpawnPose(type).getCurrentBlockSet().blocks) {
                // If a block in spawn pose does not exist in board, it does not contain piece
                if (!board.exists(block.x, block.y)) return false;
            }
            return true; // If all exist, then it contains piece
        }

        for (let type of ALL_TETROMINO_TYPES) {
            if (pieceSpawnFilled(type)) {
                // This means there is piece of type at spawn location. Check if there is a block in every row
                // to make sure that it's not just as floating piece
                let blockInEveryRow: boolean = true;
                for (let i = 0; i < 20; i++) {
                    if (board.isRowEmpty(i)) {
                        blockInEveryRow = false;
                        break;
                    }
                }

                // If there indeed is a piece of type at spawn location that is connected to the bottom of the board,
                // then this is a topout
                if (blockInEveryRow) return true;
            }
        }

        // No topout
        return false;
    };

    /**
     * On topout, end game
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {
        return OCRStateID.GAME_END;
    }

}