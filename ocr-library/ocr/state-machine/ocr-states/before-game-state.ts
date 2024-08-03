import { GameData } from "../game-data";
import { OCRFrame } from "../ocr-frame";
import { OCRState } from "../ocr-state";
import { OCRStateID } from "./ocr-state-id";

export class BeforeGameState extends OCRState {
        
    constructor() {
        super(OCRStateID.BEFORE_GAME, []);
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
    }
}