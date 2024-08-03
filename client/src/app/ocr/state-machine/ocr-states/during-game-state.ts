import { GameData } from "../game-data";
import { OCRFrame } from "../ocr-frame";
import { OCRState } from "../ocr-state";
import { OCRStateID } from "./ocr-state-id";

export class PieceDroppingState extends OCRState {
        
    constructor() {
        super(OCRStateID.PIECE_DROPPING, []);
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override onAdvanceFrame(gameData: GameData, ocrFrame: OCRFrame): void {
        
        // trigger lazy-loading of the board
        const frame = ocrFrame.getBoardUncolored();
    }
}