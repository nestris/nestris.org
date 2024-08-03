import { OCRFrame } from "./ocr-frame";
import { GameData } from "./game-data";
import { OCRState } from "./ocr-state";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";

export abstract class StateMachineLogger {

    abstract log(frame: OCRFrame, ocrState: OCRState, data?: GameData): void;

}

export interface SerializedStateMachineFrame {
    // Frame data
    boardUncolored?: string;

    // State data
    stateID: string;

    // Game data
}

export class JsonLogger extends StateMachineLogger {

    private frames: SerializedStateMachineFrame[] = [];

    override log(frame: OCRFrame, ocrState: OCRState, data?: GameData): void {

        const boardUncolored = frame.getBoardUncolored(false);

        this.frames.push({
            // Frame data
            boardUncolored: boardUncolored ? BinaryTranscoder.encode(boardUncolored) : undefined,

            // State data
            stateID: ocrState.id,

            // Game data
        });
    }

    getSerializedFrames(): SerializedStateMachineFrame[] {
        return this.frames;
    }

}