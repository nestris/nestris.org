import { GlobalState } from "../global-state";
import { TextLogger } from "../state-machine-logger";
import { PieceDroppingState } from "./during-game-state/during-game-state";
import { GameEndState } from "./game-end-state";
import { GameLimboState } from "./game-limbo-state";
import { OCRStateID } from "./ocr-state-id";

export function OcrStateFactory(ocrStateID: OCRStateID, globalState: GlobalState, textLogger: TextLogger) {
    switch (ocrStateID) {
        case OCRStateID.BEFORE_GAME:
            throw new Error(`Cannot instantiate BeforeGameState except directly by OCRStateMachine`);
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