import { OCRFrame } from "./ocr-frame";
import { GameData } from "./game-data";
import { OCRState } from "./ocr-state";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { TETROMINO_CHAR } from "../../shared/tetris/tetrominos";

export abstract class StateMachineLogger {

    abstract log(frame: OCRFrame, ocrState: OCRState, data?: GameData): void;

}

export interface SerializedStateMachineFrame {
    // Frame data
    binaryBoard?: string;
    boardNoise?: number;
    nextGrid?: string;
    nextType?: string;

    // State data
    stateID: string;

    // Game data
}

export class JsonLogger extends StateMachineLogger {

    private frames: SerializedStateMachineFrame[] = [];

    override log(frame: OCRFrame, ocrState: OCRState, data?: GameData): void {

        const binaryBoard = frame.getBinaryBoard(false);
        const boardNoise = frame.getBoardNoise(false);
        const nextType = frame.getNextType(false);

        this.frames.push({
            // Frame data
            binaryBoard: binaryBoard ? BinaryTranscoder.encode(binaryBoard) : undefined,
            boardNoise: boardNoise ? boardNoise : undefined,
            nextGrid: frame.getNextGrid().flat().join(""),
            nextType: nextType !== undefined ? TETROMINO_CHAR[nextType] : undefined,

            // State data
            stateID: ocrState.id,

            // Game data
        });
    }

    getSerializedFrames(): SerializedStateMachineFrame[] {
        return this.frames;
    }

}