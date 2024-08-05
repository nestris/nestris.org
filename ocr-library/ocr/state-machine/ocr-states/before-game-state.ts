import { TetrominoType } from "../../../shared/tetris/tetromino-type";
import { GameData } from "../game-data";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { ConsecutivePersistenceStrategy } from "../persistence-strategy";
import { OCRStateID } from "./ocr-state-id";

export class BeforeGameState extends OCRState {
        
    constructor() {
        super(OCRStateID.BEFORE_GAME, [
            new StartGameEvent()
        ]);
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override onAdvanceFrame(gameData: GameData, ocrFrame: OCRFrame): void {
        
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

    constructor() {
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
     * @param gameData The current game data
     */
    protected override precondition(ocrFrame: OCRFrame, gameData: GameData): boolean {

        // A high noise indicates that the frame may not be capturing a tetris board correctly
        const noise = ocrFrame.getBoardNoise()!;
        if (noise > 20) return false;

        // An ERROR_TYPE means that there was not sufficient similarity with a known tetromino to identify it
        const nextType = ocrFrame.getNextType()!;
        if (nextType === TetrominoType.ERROR_TYPE) return false;

        // A null level means that OCR was unable to extract the level from the frame
        if (ocrFrame.getLevel()! === null) return false;

        // Check that the board must have exactly 4 minos with an identifiable MoveableTetromino
        if (ocrFrame.getBoardOnlyTetrominoType()! === TetrominoType.ERROR_TYPE) return false;

        // TODO: Implement the rest of the requirements

        // We've met all the requirements
        return true;
    }

    /**
     * When the persistence condition is met, we transition BeforeGameState -> InGameState. This should
     * trigger the start of the game.
     * @param ocrFrame The current OCR frame
     * @param gameData The current game data
     * @returns The new state to transition to
     */
    override triggerEvent(ocrFrame: OCRFrame, gameData: GameData): OCRStateID | undefined {

        // Start the game
        gameData.startGame(ocrFrame.getLevel()!, ocrFrame.getBoardOnlyTetrominoType()!, ocrFrame.getNextType()!);

        return OCRStateID.PIECE_DROPPING;
    }

}