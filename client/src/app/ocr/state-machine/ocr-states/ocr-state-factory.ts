import { GlobalState } from "../global-state";
import { OCRConfig } from "../ocr-state-machine";
import { TextLogger } from "../state-machine-logger";
import { BeforeGameState } from "./states/before-game-state";
import { PieceDroppingState } from "./events/during-game-state";
import { GameEndState } from "./states/game-end-state";
import { GameLimboState } from "./states/game-limbo-state";
import { OCRStateID } from "./ocr-state-id";

export function OcrStateFactory(ocrStateID: OCRStateID, config: OCRConfig, globalState: GlobalState, textLogger: TextLogger) {

    const getNewState = () => { 
        switch (ocrStateID) {
            case OCRStateID.BEFORE_GAME:
                return new BeforeGameState(config, globalState, textLogger);
            case OCRStateID.PIECE_DROPPING:
                return new PieceDroppingState(config, globalState, textLogger);
            case OCRStateID.GAME_LIMBO:
                return new GameLimboState(config, globalState, textLogger);
            case OCRStateID.GAME_END:
                return new GameEndState(config, globalState, textLogger);
            default:
                throw new Error(`Invalid OCRStateID: ${ocrStateID}`);
        }
    }

    const state = getNewState();
    state.init();
    return state;
}