import { BinaryDecoder, BinaryEncoder } from "network-protocol/binary-codec";
import { TetrisBoard } from "network-protocol/tetris/tetris-board";
import { TetrominoType } from "network-protocol/tetris/tetromino-type";

export enum PacketOpcode {
  NON_GAME_BOARD_STATE_CHANGE = 0,
  // NON_GAME_NEXT_PIECE_CHANGE = 1,
  // NON_GAME_COUNTER_CHANGE = 2, // score/level/lines change
}

// each packet file should add its own (opcode, content length) pair to this map
export const PACKET_CONTENT_LENGTH: {[key in PacketOpcode]?: number} = {};

// log2 of the number of opcodes, calculated using length of enum
export const OPCODE_BIT_LENGTH = Math.ceil(Math.log2(Object.keys(PacketOpcode).length));

export abstract class Packet<Schema> {

  constructor(public readonly opcode: PacketOpcode) {}

  get bitcount(): number {
    return PACKET_CONTENT_LENGTH[this.opcode]!;
  }

  // encode the packet content without the opcode
  protected abstract _toBinaryEncoderWithoutOpcode(content: Schema): BinaryEncoder;

  // decode the packet content from a decoder
  protected abstract _decodePacketContent(content: BinaryDecoder): Schema;

  toBinaryEncoder(content: Schema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(this.opcode, OPCODE_BIT_LENGTH);
    encoder.addBinaryEncoder(this._toBinaryEncoderWithoutOpcode(content));
    return encoder;
  }

  // set packet data in-place from decoder
  decodePacket(decoder: BinaryDecoder): Schema {
    const content = decoder.nextDecoder(this.bitcount);
    return this._decodePacketContent(content);
  }
}

export const PACKET_MAP: {[key in PacketOpcode]?: Packet<any>} = {};

PACKET_CONTENT_LENGTH[PacketOpcode.NON_GAME_BOARD_STATE_CHANGE] = 412;
export interface NonGameBoardStateChangeSchema {
  deltaMs: number; // 12 bits delta in ms. Calculated by subtracting previous frame from time delta since game start
  board: TetrisBoard; // 400 bits board state, 2 bits per mino
}
export class NonGameBoardStateChangePacket extends Packet<NonGameBoardStateChangeSchema> {
  constructor() { super(PacketOpcode.NON_GAME_BOARD_STATE_CHANGE); }
  protected override _decodePacketContent(content: BinaryDecoder): NonGameBoardStateChangeSchema {
    return {
      deltaMs: content.nextUnsignedInteger(12),
      board: content.nextTetrisBoard(),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: NonGameBoardStateChangeSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.deltaMs, 12);
    encoder.addTetrisBoard(content.board);
    return encoder;
  }
}
PACKET_MAP[PacketOpcode.NON_GAME_BOARD_STATE_CHANGE] = new NonGameBoardStateChangePacket();