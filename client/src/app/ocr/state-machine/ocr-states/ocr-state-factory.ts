import { GlobalState } from "../global-state";
import { TextLogger } from "../state-machine-logger";
import { BeforeGameState } from "./before-game-state";
import { PieceDroppingState } from "./during-game-state";
import { GameEndState } from "./game-end-state";
import { GameLimboState } from "./game-limbo-state";
import { OCRStateID } from "./ocr-state-id";

export function OcrStateFactory(ocrStateID: OCRStateID, globalState: GlobalState, textLogger: TextLogger) {
    switch (ocrStateID) {
        case OCRStateID.BEFORE_GAME:
            return new BeforeGameState(globalState, textLogger);
        case OCRStateID.PIECE_DROPPING:
            return new PieceDroppingState(globalState, textLogger);
        case OCRStateID.GAME_LIMBO:
            return new GameLimboState(globalState, textLogger);
        case OCRStateID.GAME_END:
            return new GameEndState(globalState, textLogger);
        default:
            throw new Error(`Invalid OCRStateID: ${ocrStateID}`);
    }
}