import { BinaryDecoder, BinaryEncoder } from "../binary-codec";
import { TetrisBoard } from "../tetris/tetris-board";

export enum PacketOpcode {
  NON_GAME_BOARD_STATE_CHANGE = 0,
  GAME_START = 1,
  GAME_END = 2,
  LAST_PACKET_OPCODE = 3, // sent at the end of the PacketAssembler
}

export const PACKET_NAME: {[key in PacketOpcode]: string} = {
  [PacketOpcode.NON_GAME_BOARD_STATE_CHANGE]: "NON_GAME_BOARD_STATE_CHANGE",
  [PacketOpcode.GAME_START]: "GAME_START",
  [PacketOpcode.GAME_END]: "GAME_END",
  [PacketOpcode.LAST_PACKET_OPCODE]: "LAST_PACKET_OPCODE",
};


export interface PacketSchema {}

export interface PacketContent {
  opcode: PacketOpcode;
  content: PacketSchema;
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

// ================================ NON_GAME_BOARD_STATE_CHANGE =================================
PACKET_CONTENT_LENGTH[PacketOpcode.NON_GAME_BOARD_STATE_CHANGE] = 412;
export interface NonGameBoardStateChangeSchema extends PacketSchema {
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

// ================================ GAME_START =================================
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_START] = 8;
export interface GameStartSchema extends PacketSchema {
  level: number; // 8 bits level
}
export class GameStartPacket extends Packet<GameStartSchema> {
  constructor() { super(PacketOpcode.GAME_START); }
  protected override _decodePacketContent(content: BinaryDecoder): GameStartSchema {
    return {
      level: content.nextUnsignedInteger(8),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GameStartSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.level, 8);
    return encoder;
  }
}
PACKET_MAP[PacketOpcode.GAME_START] = new GameStartPacket();

// ================================ GAME_END =================================
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_END] = 0;
export interface GameEndSchema extends PacketSchema {}
export class GameEndPacket extends Packet<GameEndSchema> {
  constructor() { super(PacketOpcode.GAME_END); }
  protected override _decodePacketContent(content: BinaryDecoder): GameEndSchema {
    return {};
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GameEndSchema): BinaryEncoder {
    return new BinaryEncoder();
  }
}
PACKET_MAP[PacketOpcode.GAME_END] = new GameEndPacket();

// ================================ LAST_PACKET_OPCODE =================================
PACKET_CONTENT_LENGTH[PacketOpcode.LAST_PACKET_OPCODE] = 0;
export interface LastPacketSchema extends PacketSchema {}
export class LastPacket extends Packet<LastPacketSchema> {
  constructor() { super(PacketOpcode.LAST_PACKET_OPCODE); }
  protected override _decodePacketContent(content: BinaryDecoder): LastPacketSchema {
    return {};
  }
  protected override _toBinaryEncoderWithoutOpcode(content: LastPacketSchema): BinaryEncoder {
    return new BinaryEncoder();
  }
}
PACKET_MAP[PacketOpcode.LAST_PACKET_OPCODE] = new LastPacket();