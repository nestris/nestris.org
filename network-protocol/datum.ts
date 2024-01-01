import { ColorGrid } from "client/src/app/models/tetris/color-grid";
import { BinaryDecoder, BinaryEncoder } from "./binary-codec";

// each code has its own binary schema
export enum DatumOpcode {
    NON_GAME_BOARD_STATE_CHANGE = 0,
    NON_GAME_NEXT_PIECE_CHANGE = 1,
    NON_GAME_SCORE_CHANGE = 2,
}
// the number of bits used to encode the opcode. make sure this is large enough to encode all opcodes
export const OPCODE_BITS = 4;

/*
An abstraction for a datum schema for some opcode
*/
export abstract class Datum {

    constructor(public readonly opcode: DatumOpcode) {}
    abstract toBinaryString(): string;
}

/*
Updates the board minos. Sent in solo or sandbox mode when the client state machine is not in PLAYING_GAME state.
Neither client or server will cache this frame. When received, server broadcasts to spectators and/or opponent
*/
export class NonGameNextPieceChangeDatum extends Datum {

    static MILLISECONDS_BITS = 12;
    static COLOR_GRID_BITS = 400;

    static fromBinaryDecoder(decoder: BinaryDecoder): NonGameNextPieceChangeDatum {
        const milliseconds = decoder.nextUnsignedInteger(this.MILLISECONDS_BITS);
        const grid = ColorGrid.fromBinaryString(decoder.nextBinaryString(this.COLOR_GRID_BITS));
        return new NonGameNextPieceChangeDatum(milliseconds, grid);
    }

    constructor(public readonly milliseconds: number, public readonly grid: ColorGrid) {
        super(DatumOpcode.NON_GAME_NEXT_PIECE_CHANGE);
    }

    toBinaryString(): string {
        const encoder = new BinaryEncoder();
        encoder.addUnsignedInteger(this.milliseconds, NonGameNextPieceChangeDatum.MILLISECONDS_BITS);
        encoder.addBinaryString(this.grid.toBinaryString());
        return encoder.getBitString();
    }
}

// given a string of 0s and 1s with the first 4 bits being the opcode, return a Datum of the
// corresponding type, which maps binary data to the datum's schema
export function datumFactory(bitsWithOpcode: string): Datum {

    const decoder = new BinaryDecoder(bitsWithOpcode);

    // extract opcode
    const opcode = decoder.nextUnsignedInteger(OPCODE_BITS) as DatumOpcode;

    switch (opcode) {
        case DatumOpcode.NON_GAME_NEXT_PIECE_CHANGE:
            return NonGameNextPieceChangeDatum.fromBinaryDecoder(decoder);
        default:
            throw new Error(`Unknown datum opcode: ${opcode}`);
    }
}