import { TetrominoType } from "network-protocol/tetris/tetromino-type";
import { BinaryDecoder, BinaryEncoder } from "../binary-codec";
import { TetrisBoard } from "../tetris/tetris-board";

export enum PacketOpcode {
  NON_GAME_BOARD_STATE_CHANGE = 0,
  GAME_START = 1,
  GAME_END = 2,
  LAST_PACKET_OPCODE = 3, // sent at the end of the PacketAssembler
  GAME_PLACEMENT = 4,
  GAME_FULL_BOARD = 5, // for full board state changes where active piece cannot be inferred 
}

// map of opcode to packet name
export const PACKET_NAME: {[key in PacketOpcode]: string} = {
  [PacketOpcode.NON_GAME_BOARD_STATE_CHANGE]: "NON_GAME_BOARD_STATE_CHANGE",
  [PacketOpcode.GAME_START]: "GAME_START",
  [PacketOpcode.GAME_END]: "GAME_END",
  [PacketOpcode.LAST_PACKET_OPCODE]: "LAST_PACKET_OPCODE",
  [PacketOpcode.GAME_PLACEMENT]: "GAME_PLACEMENT",
  [PacketOpcode.GAME_FULL_BOARD]: "GAME_FULL_BOARD",
};

// packets that are only sent during a game
const GAME_ONLY_PACKETS = new Set([
  PacketOpcode.GAME_START,
  PacketOpcode.GAME_END,
  PacketOpcode.GAME_PLACEMENT,
  PacketOpcode.GAME_FULL_BOARD,
]);

export function isGameOnlyPacket(opcode: PacketOpcode): boolean {
  return GAME_ONLY_PACKETS.has(opcode);
}

// packets to be included in the database. All else are ignored.
// We do not include GAME_FULL_BOARD placements because they are sent every frame, and are too expensive to store
const DATABASE_PACKETS = new Set([
  PacketOpcode.GAME_START,
  PacketOpcode.GAME_PLACEMENT
]);

export function isDatabasePacket(opcode: PacketOpcode): boolean {
  return DATABASE_PACKETS.has(opcode);
}

export interface PacketSchema {}

export interface PacketContent {
  opcode: PacketOpcode;
  content: PacketSchema;
  binary: BinaryEncoder;
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
  delta: number; // 12 bits delta in ms. Calculated by subtracting previous frame from time delta since game start
  board: TetrisBoard; // 400 bits board state, 2 bits per mino
}
export class NonGameBoardStateChangePacket extends Packet<NonGameBoardStateChangeSchema> {
  constructor() { super(PacketOpcode.NON_GAME_BOARD_STATE_CHANGE); }
  protected override _decodePacketContent(content: BinaryDecoder): NonGameBoardStateChangeSchema {
    return {
      delta: content.nextUnsignedInteger(12),
      board: content.nextTetrisBoard(),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: NonGameBoardStateChangeSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.delta, 12);
    encoder.addTetrisBoard(content.board);
    return encoder;
  }
}
PACKET_MAP[PacketOpcode.NON_GAME_BOARD_STATE_CHANGE] = new NonGameBoardStateChangePacket();

// ================================ GAME_START =================================
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_START] = 14;
export interface GameStartSchema extends PacketSchema {
  level: number; // 8 bits level
  current: TetrominoType; // 3 bits current piece type
  next: TetrominoType; // 3 bits next piece type
}
export class GameStartPacket extends Packet<GameStartSchema> {
  constructor() { super(PacketOpcode.GAME_START); }
  protected override _decodePacketContent(content: BinaryDecoder): GameStartSchema {
    return {
      level: content.nextUnsignedInteger(8),
      current: content.nextTetrominoType(),
      next: content.nextTetrominoType(),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GameStartSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.level, 8);
    encoder.addTetrominoType(content.current);
    encoder.addTetrominoType(content.next);
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

// ================================ GAME_PLACEMENT =================================
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_PLACEMENT] = 18;
export interface GamePlacementSchema extends PacketSchema {
  nextNextType: TetrominoType; // 3 bits piece type after current and next piece
  rotation: number; // 2 bits rotation (0-3)
  x: number; // 4 bits x (0 to 15 stored, subtract 2 to get -2 to 13)
  y: number; // 5 bits y (0 to 31 stored, subtract 2 to get -2 to 29)
  pushdown: number; // 4 bits pushdown (0-15)
}
export class GamePlacementPacket extends Packet<GamePlacementSchema> {
  constructor() { super(PacketOpcode.GAME_PLACEMENT); }
  protected override _decodePacketContent(content: BinaryDecoder): GamePlacementSchema {
    return {
      nextNextType: content.nextTetrominoType(),
      rotation: content.nextUnsignedInteger(2),
      x: content.nextUnsignedInteger(4) - 2,
      y: content.nextUnsignedInteger(5) - 2,
      pushdown: content.nextUnsignedInteger(4),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GamePlacementSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addTetrominoType(content.nextNextType);
    encoder.addUnsignedInteger(content.rotation, 2);
    encoder.addUnsignedInteger(content.x + 2, 4);
    encoder.addUnsignedInteger(content.y + 2, 5);
    encoder.addUnsignedInteger(content.pushdown, 4);
    return encoder;
  }
}
PACKET_MAP[PacketOpcode.GAME_PLACEMENT] = new GamePlacementPacket();

// ================================ GAME_FULL_BAORD =================================
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_FULL_BOARD] = 412;
export interface GameFullBoardSchema extends PacketSchema {
  delta: number; // 12 bits delta in ms. Calculated by subtracting previous frame from time delta since game start
  board: TetrisBoard; // 400 bits board state, 2 bits per mino
}
export class GameFullBoardPacket extends Packet<GameFullBoardSchema> {
  constructor() { super(PacketOpcode.GAME_FULL_BOARD); }
  protected override _decodePacketContent(content: BinaryDecoder): GameFullBoardSchema {
    return {
      delta: content.nextUnsignedInteger(12),
      board: content.nextTetrisBoard(),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GameFullBoardSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.delta, 12);
    encoder.addTetrisBoard(content.board);
    return encoder;
  }
}
PACKET_MAP[PacketOpcode.GAME_FULL_BOARD] = new GameFullBoardPacket();
