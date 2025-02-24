import { StateEvent } from "../../ocr-state";
import { PieceDroppingState } from "./during-game-state";
import { GlobalState } from "../../global-state";
import { ConsecutivePersistenceStrategy, TimedPersistenceStrategy } from "../../../state-machine/persistence-strategy";
import { OCRFrame } from "../../../state-machine/ocr-frame";
import { ALL_TETROMINO_TYPES, TetrominoType } from "../../../../shared/tetris/tetromino-type";
import MoveableTetromino from "../../../../shared/tetris/moveable-tetromino";
import { OCRStateID } from "../ocr-state-id";

/**
 * Event that triggers when a new piece is spawned without a line clear. This should result in the previous
 * piece being placed, and updating the stable board to reflect the placed piece.
 */
export class TopoutEvent extends StateEvent {

    constructor(private readonly myState: PieceDroppingState, private readonly globalState: GlobalState) {
            
        // We require topout conditions to be met for one second
        super(
            "TopoutEvent",
            new TimedPersistenceStrategy(1000)
        );
    }

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

        // if any of the tetromino types are contained in board, then this is precondition for topout
        if (ALL_TETROMINO_TYPES.some(type => pieceSpawnFilled(type))) return true;

        // No topout
        return false;
    };

    /**
     * On topout, end game
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {
        this.globalState.endGame();
        return OCRStateID.GAME_END;
    }

}