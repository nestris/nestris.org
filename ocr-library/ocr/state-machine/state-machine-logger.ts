import { OCRFrame } from "./ocr-frame";
import { GameData } from "./game-data";
import { EventStatus, OCRState } from "./ocr-state";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { TETROMINO_CHAR } from "../../shared/tetris/tetrominos";
import { BinaryDecoder, BinaryEncoder } from "../../shared/network/binary-codec";
import { PACKET_NAME, PacketOpcode } from "shared/network/stream-packets/packet";
import { PacketDisassembler } from "shared/network/stream-packets/packet-disassembler";

export abstract class StateMachineLogger {

    abstract log(
        frame: OCRFrame,
        ocrState: OCRState,
        eventStatuses: EventStatus[],
        packets: BinaryEncoder[],
        data?: GameData,
    ): void;

}

export interface SerializedStateMachineFrame {
    // Frame data
    binaryBoard?: string;
    boardNoise?: number;
    nextGrid?: string;
    nextType?: string;

    // State data
    stateID: string;
    eventStatuses: EventStatus[];

    // Game data

    // Packet data
    packet: string[];
}

export class JsonLogger extends StateMachineLogger {

    private frames: SerializedStateMachineFrame[] = [];

    override log(frame: OCRFrame, ocrState: OCRState, eventStatuses: EventStatus[], packets: BinaryEncoder[], data?: GameData): void {

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
            eventStatuses: eventStatuses,

            // Game data

            // Packet data
            packet: packets.map(packet => {
                const disassembler = new PacketDisassembler(packet.convertToUInt8Array(), false);
                const opcode = disassembler.nextPacket().opcode;
                return PACKET_NAME[opcode];
            }),
        });
    }

    getSerializedFrames(): SerializedStateMachineFrame[] {
        return this.frames;
    }

}