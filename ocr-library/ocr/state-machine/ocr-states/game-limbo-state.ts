import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState } from "../ocr-state";
import { TextLogger } from "../state-machine-logger";
import { OCRStateID } from "./ocr-state-id";

export class GameLimboState extends OCRState {
    public override readonly id = OCRStateID.GAME_LIMBO;

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override onAdvanceFrame(ocrFrame: OCRFrame): void {
        
        // trigger lazy-loading of the board
        const frame = ocrFrame.getBinaryBoard();
    }
}