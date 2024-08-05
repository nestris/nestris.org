import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState } from "../ocr-state";
import { OCRStateID } from "./ocr-state-id";

export class GameEndState extends OCRState {
        
    constructor(globalState: GlobalState) {
        super(OCRStateID.GAME_END, globalState);
    }

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