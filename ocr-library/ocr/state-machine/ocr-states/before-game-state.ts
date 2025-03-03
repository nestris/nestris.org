import { TETROMINO_CHAR } from "../../../shared/tetris/tetrominos";
import { TetrominoType } from "../../../shared/tetris/tetromino-type";
import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { ConsecutivePersistenceStrategy } from "../persistence-strategy";
import { LogType, TextLogger } from "../state-machine-logger";
import { OCRStateID } from "./ocr-state-id";
import { OCRConfig } from "../ocr-state-machine";
import { GymRNG } from "src/app/shared/tetris/piece-sequence-generation/gym-rng";

export const NOISE_THRESHOLD = 20;

export class BeforeGameState extends OCRState {
    public override readonly id = OCRStateID.BEFORE_GAME;

    public override init() {
        this.registerEvent(new StartGameEvent(this.config, this.globalState, this.textLogger));
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
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
    public override readonly persistence = new ConsecutivePersistenceStrategy(5);

    /**
     * @param startLevel If the level is specified, the level must match for the game to start
     * @param globalState 
     * @param textLogger 
     */
    constructor(
        protected readonly config: OCRConfig,
        protected readonly globalState: GlobalState,
        protected readonly textLogger: TextLogger
    ) { super(); }

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
    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {

        // Check that the board must have exactly 4 minos with an identifiable MoveableTetromino
        const currentType = ocrFrame.getBoardOnlyTetrominoType()!;
        if (currentType === TetrominoType.ERROR_TYPE) {
            this.textLogger.log(LogType.VERBOSE, "StartGameEvent: Board does not have exactly 4 minos with an identifiable MoveableTetromino");
            return false;
        }

        // An ERROR_TYPE means that there was not sufficient similarity with a known tetromino to identify it
        const nextType = ocrFrame.getNextType()!;
        if (nextType === TetrominoType.ERROR_TYPE) {
            this.textLogger.log(LogType.VERBOSE, "StartGameEvent: Next piece type is not defined");
            return false;
        }

        // If there is a seed, check seed
        if (this.config.seed) {
            const rng = new GymRNG(this.config.seed);
            const seedFirstPiece = rng.getNextPiece();
            const seedNextPiece = rng.getNextPiece();
            if (currentType !== seedFirstPiece || nextType !== seedNextPiece) {
                this.textLogger.log(LogType.VERBOSE, "StartGameEvent: First and next piece do not correspond to seed");
                return false;
            }
        }

        // A level of -1 means that OCR was unable to extract the level from the frame
        const level = await ocrFrame.getLevel()!;
        if (level === -1) {
            this.textLogger.log(LogType.VERBOSE, "StartGameEvent: Level is not defined");
            return false;
        }

        if (this.config.startLevel !== null && level !== this.config.startLevel) {
            this.textLogger.log(LogType.VERBOSE, `StartGameEvent: Starting level ${level} does not match required level ${this.config.startLevel}`);
            return false;
        }

        const score = await ocrFrame.getScore()!;
        if (score === -1) {
            this.textLogger.log(LogType.VERBOSE, "StartGameEvent: Score is not defined");
            return false;
        }

        if (score !== 0) {
            this.textLogger.log(LogType.VERBOSE, `StartGameEvent: Score is not 0: ${score}`);
            return false;
        }

        // A high noise indicates that the frame may not be capturing a tetris board correctly
        const noise = ocrFrame.getBoardNoise()!;
        if (noise > NOISE_THRESHOLD) {
            this.textLogger.log(LogType.VERBOSE, `StartGameEvent: Noise too high: ${noise}, required < ${NOISE_THRESHOLD}`);
            return false;
        }

        // TODO: Implement the rest of the requirements

        // We've met all the requirements
        this.textLogger.log(LogType.VERBOSE, "StartGameEvent: All requirements met");
        return true;
    }

    /**
     * When the persistence condition is met, we transition BeforeGameState -> InGameState. This should
     * trigger the start of the game.
     * @param ocrFrame The current OCR frame
     * @returns The new state to transition to
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {

        // Start the game
        const current = ocrFrame.getBoardOnlyTetrominoType()!;
        const next = ocrFrame.getNextType()!;
        this.globalState.startGame((await ocrFrame.getLevel())!, current, next);
        this.textLogger.log(LogType.INFO, `Start game with level ${ocrFrame.getLevel()!}, current piece ${TETROMINO_CHAR[current]}, next piece ${TETROMINO_CHAR[next]}`);
        return OCRStateID.PIECE_DROPPING;
    }

}