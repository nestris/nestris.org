import { TETROMINO_CHAR } from "../../../shared/tetris/tetrominos";
import { TetrominoType } from "../../../shared/tetris/tetromino-type";
import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { ConsecutivePersistenceStrategy } from "../persistence-strategy";
import { TextLogger } from "../state-machine-logger";
import { OCRStateID } from "./ocr-state-id";

export class BeforeGameState extends OCRState {
        
    constructor(globalState: GlobalState, textLogger: TextLogger) {
        super(OCRStateID.BEFORE_GAME, globalState, textLogger);

        this.registerEvent(new StartGameEvent(globalState, textLogger));
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override onAdvanceFrame(ocrFrame: OCRFrame): void {
        
        // trigger lazy-loading of the board properties
        const frame = ocrFrame.getBinaryBoard();
        const consistency = ocrFrame.getBoardNoise();
        const nextType = ocrFrame.getNextType();
    }
}


/**
 * Event that triggers the start of the game. A set of requirements must be met for some number of consecutive frames
 * for the StartGameEvent to trigger, which causes transition BeforeGameState -> InGameState.
 */
export class StartGameEvent extends StateEvent {

    constructor(private readonly globalState: GlobalState, private readonly textLogger: TextLogger) {
        super(
            "StartGameEvent",
            new ConsecutivePersistenceStrategy(5)
        );
    }

    /**
     * Defines the requirements for the StartGameEvent to trigger. The requirements are as follows:
     * - The board must be have low noise
     * - The next piece must be defined
     * - The score must be 0
     * - The level must be valid
     * - The board must have exactly 4 minos with an identifiable MoveableTetromino
     * 
     * @param ocrFrame The current OCR frame
     */
    protected override precondition(ocrFrame: OCRFrame): boolean {

        // A high noise indicates that the frame may not be capturing a tetris board correctly
        const noise = ocrFrame.getBoardNoise()!;
        if (noise > 20) {
            this.textLogger.log(`StartGameEvent: Noise too high: ${noise}, required < 20`);
            return false;
        }

        // An ERROR_TYPE means that there was not sufficient similarity with a known tetromino to identify it
        const nextType = ocrFrame.getNextType()!;
        if (nextType === TetrominoType.ERROR_TYPE) {
            this.textLogger.log("StartGameEvent: Next piece type is not defined");
            return false;
        }

        // A level of -1 means that OCR was unable to extract the level from the frame
        if (ocrFrame.getLevel()! === -1) {
            this.textLogger.log("StartGameEvent: Level is not defined");
            return false;
        }

        // Check that the board must have exactly 4 minos with an identifiable MoveableTetromino
        if (ocrFrame.getBoardOnlyTetrominoType()! === TetrominoType.ERROR_TYPE) {
            this.textLogger.log("StartGameEvent: Board does not have exactly 4 minos with an identifiable MoveableTetromino");
            return false;
        }

        // TODO: Implement the rest of the requirements

        // We've met all the requirements
        this.textLogger.log("StartGameEvent: All requirements met");
        return true;
    }

    /**
     * When the persistence condition is met, we transition BeforeGameState -> InGameState. This should
     * trigger the start of the game.
     * @param ocrFrame The current OCR frame
     * @returns The new state to transition to
     */
    override triggerEvent(ocrFrame: OCRFrame): OCRStateID | undefined {

        // Start the game
        const current = ocrFrame.getBoardOnlyTetrominoType()!;
        const next = ocrFrame.getNextType()!;
        this.globalState.startGame(ocrFrame.getLevel()!, current, next);
        this.textLogger.log(`Start game with level ${ocrFrame.getLevel()!}, current piece ${TETROMINO_CHAR[current]}, next piece ${TETROMINO_CHAR[next]}`);
        return OCRStateID.PIECE_DROPPING;
    }

}