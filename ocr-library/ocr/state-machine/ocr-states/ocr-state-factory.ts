import { BeforeGameState } from "./before-game-state";
import { PieceDroppingState } from "./during-game-state";
import { GameEndState } from "./game-end-state";
import { GameLimboState } from "./game-limbo-state";
import { OCRStateID } from "./ocr-state-id";

export function OcrStateFactory(ocrStateID: OCRStateID) {
    switch (ocrStateID) {
        case OCRStateID.BEFORE_GAME:
            return new BeforeGameState();
        case OCRStateID.PIECE_DROPPING:
            return new PieceDroppingState();
        case OCRStateID.GAME_LIMBO:
            return new GameLimboState();
        case OCRStateID.GAME_END:
            return new GameEndState();
        default:
            throw new Error(`Invalid OCRStateID: ${ocrStateID}`);
    }
}