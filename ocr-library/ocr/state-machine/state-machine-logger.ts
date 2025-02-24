import { OCRFrame } from "./ocr-frame";
import { GlobalState } from "./global-state";
import { EventStatus, OCRState } from "./ocr-state";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { TETROMINO_CHAR } from "../../shared/tetris/tetrominos";
import { BinaryEncoder } from "../../shared/network/binary-codec";
import { PACKET_NAME } from "../../shared/network/stream-packets/packet";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { TetrominoType } from "../../shared/tetris/tetromino-type";

export enum LogType {
    INFO = "INFO",
    ERROR = "ERROR",
    VERBOSE = "VERBOSE"
}

export class TextLogger {

    private logs: {type: LogType, message: string}[] = [];

    log(type: LogType, message: string): void {
        this.logs.push({ type, message });
    }

    popLogs(): string[] {
        const logs = this.logs;
        for (const {type, message} of logs) {
            if (type === LogType.INFO) console.log(message);
            if (type === LogType.ERROR) console.error(message);
        }

        this.logs = [];

        return logs.map(log => log.message);
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
    ): Promise<void>;

}

export interface SerializedStateMachineFrame {
    binaryBoard?: string;
    stableBoard?: string;

    boardNoise?: number;
    nextGrid?: string;
    nextType?: string;
    level?: number;
    score?: number;
    boardOnlyType?: string;

    // State data
    stateID: string;
    stateCount: number;
    stateFrameCount: number;
    eventStatuses: EventStatus[];

    // Game data
    gameCurrentType?: string;
    gameNextType?: string;
    gameScore?: number;
    gameLevel?: number;
    gameLines?: number;
    

    // Packet data
    packets: string[];

    textLogs: string[];
}

export class JsonLogger extends StateMachineLogger {

    private frames: SerializedStateMachineFrame[] = [];

    override async log(stateCount: number, frame: OCRFrame, ocrState: OCRState, eventStatuses: EventStatus[], packets: BinaryEncoder[], globalState: GlobalState, textLogs: string[]) {

        const typeToChar = (type: TetrominoType | undefined) => type !== undefined ? TETROMINO_CHAR[type] : undefined;

        const binaryBoard = frame.getBinaryBoard(null, false);

        const stableBoard = globalState.game?.getStableBoard();

        this.frames.push({
            // Frame data
            binaryBoard: binaryBoard ? BinaryTranscoder.encode(binaryBoard) : undefined,
            boardNoise: frame.getBoardNoise(false),
            nextGrid: frame.getNextGrid().flat().join(""),
            nextType: typeToChar(frame.getNextType(false)),
            level: await frame.getLevel(false),
            score: await frame.getScore(false),
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
            gameScore: globalState.game?.getStatus().score,
            gameLines: globalState.game?.getStatus().lines,
            gameLevel: globalState.game?.getStatus().level,

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