import { GlobalState } from "../global-state";
import { BeforeGameState } from "./before-game-state";
import { PieceDroppingState } from "./during-game-state";
import { GameEndState } from "./game-end-state";
import { GameLimboState } from "./game-limbo-state";
import { OCRStateID } from "./ocr-state-id";

export function OcrStateFactory(ocrStateID: OCRStateID, globalState: GlobalState) {
    switch (ocrStateID) {
        case OCRStateID.BEFORE_GAME:
            return new BeforeGameState(globalState);
        case OCRStateID.PIECE_DROPPING:
            return new PieceDroppingState(globalState);
        case OCRStateID.GAME_LIMBO:
            return new GameLimboState(globalState);
        case OCRStateID.GAME_END:
            return new GameEndState(globalState);
        default:
            throw new Error(`Invalid OCRStateID: ${ocrStateID}`);
    }
}