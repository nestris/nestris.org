import { MTPose } from "../../tetris/moveable-tetromino";
import { TetrisBoard } from "../../tetris/tetris-board";
import { TetrominoType } from "../../tetris/tetromino-type";
import { BinaryEncoder, BinaryDecoder } from "../binary-codec";


export enum PacketOpcode {
  LAST_PACKET_OPCODE = 0, // sent at the end of the PacketAssembler
  GAME_START = 2,
  GAME_END = 3,
  GAME_PLACEMENT = 4,
  GAME_FULL_BOARD = 5, // for full board state changes where active piece cannot be inferred 
  GAME_ABBR_BOARD = 6, // for abbreviated board state changes where active piece can be inferred
  GAME_RECOVERY = 7, // encapsulates all state during a game for a full recovery
  GAME_COUNTDOWN = 9, // stores the current countdown value, or not in countdown if value is 0 
}

// map of opcode to packet name
export const PACKET_NAME: {[key in PacketOpcode]: string} = {
  [PacketOpcode.GAME_START]: "GAME_START",
  [PacketOpcode.GAME_END]: "GAME_END",
  [PacketOpcode.LAST_PACKET_OPCODE]: "LAST_PACKET_OPCODE",
  [PacketOpcode.GAME_PLACEMENT]: "GAME_PLACEMENT",
  [PacketOpcode.GAME_FULL_BOARD]: "GAME_FULL_BOARD",
  [PacketOpcode.GAME_ABBR_BOARD]: "GAME_ABBR_BOARD",
  [PacketOpcode.GAME_RECOVERY]: "GAME_RECOVERY",
  [PacketOpcode.GAME_COUNTDOWN]: "GAME_COUNTDOWN",
};


export interface PacketSchema {}

// Timed packets do not execute instantly - rather, they are executed after a certain time has passed
// stored as rounded 12 bit integer in ms, calculated by subtracting previous frame from time delta since game start
// Successive deltas must be guaranteed not to accumulate rounding errors, so use TimeDelta to mitigate this
// PacketReplayer should have logic that waits until the delta time has passed before executing this packet
export interface TimedPacketSchema extends PacketSchema {
  delta: number; // 12 bits delta in ms
}

// decoded info for one packet from stream
export interface PacketContent {
  opcode: PacketOpcode;
  content: PacketSchema;
  binary: BinaryEncoder;
}

// check if a packet content is timed. If so returns the delta time in ms
// otherwise, returns undefined
export function getPacketDelay(content: PacketContent): number | undefined {
  return (content.content as TimedPacketSchema).delta;
}

// group of packets sent from another player through server, decoded from stream into useful list of packets
export interface PacketGroup {
  playerIndex: number;
  packets: PacketContent[];
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

    const contentEncoder = this._toBinaryEncoderWithoutOpcode(content);

    // sanity check to ensure that the content length matches the expected length
    if (contentEncoder.bitcount !== this.bitcount) {
      throw new Error(`Packet ${PACKET_NAME[this.opcode]} content length mismatch: expected ${this.bitcount}, got ${contentEncoder.bitcount}`);
    }

    // optional: log packet content
    //console.log(PACKET_NAME[this.opcode], content);

    encoder.addBinaryEncoder(contentEncoder);
    return encoder;
  }

  // set packet data in-place from decoder
  // precondition: opcode has already been stripped
  // there may still be bits left in the decoder after this operation, so
  // make sure not to read past the end of the packet
  decodePacket(decoder: BinaryDecoder): Schema {

    // reserve the next [bitcount] bits for this packet's content
    const content = decoder.nextDecoder(this.bitcount);

    // decode the packet content using subclass-specific logic
    const decodedContent = this._decodePacketContent(content);

    // assert that the decoder fully consumed the packet
    if (content.numBitsLeft() !== 0) {
      throw new Error(`Packet ${PACKET_NAME[this.opcode]} decoder did not fully consume packet: ${content.numBitsLeft()} bits left`);
    }

    return decodedContent;
  }
}

export const PACKET_MAP: {[key in PacketOpcode]?: Packet<any>} = {};


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
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_PLACEMENT] = 30;
export interface GamePlacementSchema extends TimedPacketSchema {
  // inherited 12 bit delta in ms
  nextNextType: TetrominoType; // 3 bits piece type after current and next piece
  mtPose: MTPose // 11 bits
  pushdown: number; // 4 bits pushdown (0-15)
}
export class GamePlacementPacket extends Packet<GamePlacementSchema> {
  constructor() { super(PacketOpcode.GAME_PLACEMENT); }
  protected override _decodePacketContent(content: BinaryDecoder): GamePlacementSchema {
    return {
      delta: content.nextUnsignedInteger(12),
      nextNextType: content.nextTetrominoType(),
      mtPose: content.nextMTPose(),
      pushdown: content.nextUnsignedInteger(4),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GamePlacementSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.delta, 12);
    encoder.addTetrominoType(content.nextNextType);
    encoder.addMTPose(content.mtPose);
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

// ================================ GAME_ABBR_BOARD =================================
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_ABBR_BOARD] = 23;
export interface GameAbbrBoardSchema extends TimedPacketSchema {
  // inherited 12 bit delta in ms
  mtPose: MTPose; // 11 bits
}
export class GameAbbrBoardPacket extends Packet<GameAbbrBoardSchema> {
  constructor() { super(PacketOpcode.GAME_ABBR_BOARD); }
  protected override _decodePacketContent(content: BinaryDecoder): GameAbbrBoardSchema {
    return {
      delta: content.nextUnsignedInteger(12),
      mtPose: content.nextMTPose(),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GameAbbrBoardSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.delta, 12);
    encoder.addMTPose(content.mtPose);
    return encoder;
  }
}
PACKET_MAP[PacketOpcode.GAME_ABBR_BOARD] = new GameAbbrBoardPacket();


// ================================ GAME_RECOVERY =================================
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_RECOVERY] = 468;
export interface GameRecoverySchema extends PacketSchema {
  startLevel: number; // 8 bits start level of game. If not in game, value does not matter
  current: TetrominoType; // 3 bits current piece type
  next: TetrominoType; // 3 bits next piece type
  isolatedBoard: TetrisBoard; // 400 bits isolated board state, 2 bits per mino
  score: number; // 26 bits score, cap at 67,108,863
  level: number; // 8 bits level, cap at 255
  lines: number; // 16 bits lines, cap at 65,535
  countdown: number; // 4 bits current countdown number, 0-15. 0 means not in countdown
}
export class GameRecoveryPacket extends Packet<GameRecoverySchema> {
  constructor() { super(PacketOpcode.GAME_RECOVERY); }
  protected override _decodePacketContent(content: BinaryDecoder): GameRecoverySchema {
    return {
      startLevel: content.nextUnsignedInteger(8),
      current: content.nextTetrominoType(),
      next: content.nextTetrominoType(),
      isolatedBoard: content.nextTetrisBoard(),
      score: content.nextUnsignedInteger(26),
      level: content.nextUnsignedInteger(8),
      lines: content.nextUnsignedInteger(16),
      countdown: content.nextUnsignedInteger(4),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GameRecoverySchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.startLevel, 8);
    encoder.addTetrominoType(content.current);
    encoder.addTetrominoType(content.next);
    encoder.addTetrisBoard(content.isolatedBoard);
    encoder.addUnsignedInteger(content.score, 26);
    encoder.addUnsignedInteger(content.level, 8);
    encoder.addUnsignedInteger(content.lines, 16);
    encoder.addUnsignedInteger(content.countdown, 4);
    return encoder;
  }
}
PACKET_MAP[PacketOpcode.GAME_RECOVERY] = new GameRecoveryPacket();


// ================================ GAME_COUNTDOWN =================================
// Timed because board might not be updated while in countdown
PACKET_CONTENT_LENGTH[PacketOpcode.GAME_COUNTDOWN] = 16;
export interface GameCountdownSchema extends TimedPacketSchema {
  // inherited 12 bit delta in ms
  countdown: number; // 4 bits current countdown number, 0-15. 0 means not in countdown
}
export class GameCountdownPacket extends Packet<GameCountdownSchema> {
  constructor() { super(PacketOpcode.GAME_COUNTDOWN); }
  protected override _decodePacketContent(content: BinaryDecoder): GameCountdownSchema {
    return {
      delta: content.nextUnsignedInteger(12),
      countdown: content.nextUnsignedInteger(4),
    };
  }
  protected override _toBinaryEncoderWithoutOpcode(content: GameCountdownSchema): BinaryEncoder {
    const encoder = new BinaryEncoder();
    encoder.addUnsignedInteger(content.delta, 12);
    encoder.addUnsignedInteger(content.countdown, 4);
    return encoder;
  }
}
PACKET_MAP[PacketOpcode.GAME_COUNTDOWN] = new GameCountdownPacket();