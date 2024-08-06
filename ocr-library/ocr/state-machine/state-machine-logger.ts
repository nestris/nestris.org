import { OCRFrame } from "./ocr-frame";
import { GlobalState } from "./global-state";
import { EventStatus, OCRState } from "./ocr-state";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { TETROMINO_CHAR } from "../../shared/tetris/tetrominos";
import { BinaryEncoder } from "../../shared/network/binary-codec";
import { PACKET_NAME } from "../../shared/network/stream-packets/packet";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { TetrominoType } from "shared/tetris/tetromino-type";

export class TextLogger {

    private logs: string[] = [];

    log(message: string): void {
        this.logs.push(message);
    }

    popLogs(): string[] {
        const logs = this.logs;
        this.logs = [];
        return logs;
    }
}

export abstract class StateMachineLogger {

    abstract log(
        stateCount: number,
        frame: OCRFrame,
        ocrState: OCRState,
        eventStatuses: EventStatus[],
        packets: BinaryEncoder[],
        globalState: GlobalState,
        textLogs: string[]
    ): void;

}

export interface SerializedStateMachineFrame {
    // Frame data
    binaryBoard?: string;
    boardNoise?: number;
    nextGrid?: string;
    nextType?: string;
    level?: number;
    boardOnlyType?: string;

    // State data
    stateID: string;
    stateCount: number;
    stateFrameCount: number;
    eventStatuses: EventStatus[];

    // Game data
    stableBoard?: string;
    gameCurrentType?: string;
    gameNextType?: string;

    // Packet data
    packets: string[];

    textLogs: string[];
}

export class JsonLogger extends StateMachineLogger {

    private frames: SerializedStateMachineFrame[] = [];

    override log(stateCount: number, frame: OCRFrame, ocrState: OCRState, eventStatuses: EventStatus[], packets: BinaryEncoder[], globalState: GlobalState, textLogs: string[]): void {

        const typeToChar = (type: TetrominoType | undefined) => type !== undefined ? TETROMINO_CHAR[type] : undefined;

        const binaryBoard = frame.getBinaryBoard(false);

        const stableBoard = globalState.game?.getStableBoard();

        this.frames.push({
            // Frame data
            binaryBoard: binaryBoard ? BinaryTranscoder.encode(binaryBoard) : undefined,
            boardNoise: frame.getBoardNoise(false),
            nextGrid: frame.getNextGrid().flat().join(""),
            nextType: typeToChar(frame.getNextType(false)),
            level: frame.getLevel(false),
            boardOnlyType: typeToChar(frame.getBoardOnlyTetrominoType(false)),

            // State data
            stateID: ocrState.id,
            stateCount: stateCount,
            stateFrameCount: ocrState.getRelativeFrameCount(),
            eventStatuses: eventStatuses,

            // Game data
            stableBoard: stableBoard ? BinaryTranscoder.encode(stableBoard) : undefined,
            gameCurrentType: typeToChar(globalState.game?.getCurrentType()),
            gameNextType: typeToChar(globalState.game?.getNextType()),

            // Packet data
            packets: packets.map(packet => {
                const disassembler = new PacketDisassembler(packet.convertToUInt8Array(), false);
                const opcode = disassembler.nextPacket().opcode;
                return PACKET_NAME[opcode];
            }),

            textLogs: textLogs
        });
    }

    getSerializedFrames(): SerializedStateMachineFrame[] {
        return this.frames;
    }

}