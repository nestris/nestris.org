import { TetrisBoard } from "../tetris/tetris-board";
import { BinaryTranscoder } from "../tetris-board-transcoding/binary-transcoder";
import { MTPose } from "../tetris/moveable-tetromino";
import { TetrominoType } from "../tetris/tetromino-type";

/*
Builder for compact binary encoding. Allows you to add different types of data
and then convert to a string of 0s and 1s and/or a Uint8Array.
*/
export class BinaryEncoder {
    private bits: string = '';
    private bitCount: number = 0;

    constructor() { }

    copy(): BinaryEncoder {
        const copy = new BinaryEncoder();
        copy.addBinaryString(this.bits);
        return copy;
    }

    get bitcount(): number {
        return this.bitCount;
    }

    addBoolean(value: boolean): void {
        this.bits += value ? '1' : '0';
        this.bitCount++;
    }

    // Adds a string of 0s and 1s
    addBinaryString(value: string): void {
        this.bits += value;
        this.bitCount += value.length;
    }

    addUnsignedInteger(value: number, bitCount: number): void {
        if (value < 0) {
            throw new Error("Value must be positive");
        }

        if (bitCount < 1) {
            throw new Error("Bit count must be at least 1");
        }

        const maxValue = Math.pow(2, bitCount) - 1;
        if (value > maxValue) {
            console.log(`Warning: Value ${value} is too large to fit in ${bitCount} bits, capping at ${maxValue}`);
            value = maxValue;
        }

        // Convert the value to a binary string and pad it to the desired bit length
        this.bits += value.toString(2).padStart(bitCount, '0');
        this.bitCount += bitCount;
    }

    addTetrominoType(type: TetrominoType): void {
        this.addUnsignedInteger(type, 3);
    }

    getBitString(): string {
        return this.bits;
    }

    addBinaryEncoder(encoder: BinaryEncoder): void {
        this.addBinaryString(encoder.getBitString());
    }

    addBinaryDecoder(decoder: BinaryDecoder): void {
        this.addBinaryString(decoder.bits);
    }

    addTetrisBoard(board: TetrisBoard): void {
        // base4 has 200 chars of 0-3
        const base4 = BinaryTranscoder.encode(board);

        // encode to binary by converting each base4 digit to 2 bits
        for (let i = 0; i < base4.length; i++) {
            const value = parseInt(base4[i]);
            this.addUnsignedInteger(value, 2);
        }
    }

    // 11 bits total
    // rotation: number; // 2 bits rotation (0-3)
    // 4 bits x (-2 to 13 range, add 2 to store 0 to 15)
    // 5 bits y (-2 to 29 range, add 2 to store 0 to 31)
    addMTPose(mt: MTPose) {

        if (mt.r < 0 || mt.r > 3) {
            throw new Error("Rotation must be between 0 and 3");
        }

        if (mt.x < -2 || mt.x > 13) {
            throw new Error("X must be between -2 and 13");
        }

        if (mt.y < -2 || mt.y > 29) {
            throw new Error("Y must be between -2 and 29");
        }

        this.addUnsignedInteger(mt.r, 2);
        this.addUnsignedInteger(mt.x + 2, 4);
        this.addUnsignedInteger(mt.y + 2, 5);
    }

    convertToUInt8Array(): Uint8Array {
        // Pad the bits to make the length a multiple of 8 (one byte)
        const paddedBits = this.bits.padEnd(this.bitCount + (8 - this.bitCount % 8) % 8, '0');

        // Calculate the number of bytes needed
        const byteCount = paddedBits.length / 8;

        // Create a Uint8Array to hold the bytes
        const bytes = new Uint8Array(byteCount);

        // Split the string into chunks of 8 bits and convert each to a byte
        for (let i = 0; i < byteCount; i++) {
            bytes[i] = parseInt(paddedBits.substring(8 * i, 8 * (i + 1)), 2);
        }

        return bytes;
    }
}

/*
Decodes from either a string of 0s and 1s or a Uint8Array into different types of data.
Iterator-style syntax to read data one block at a time by calling next*() methods
specifying the type and length of the data to read.
*/
export class BinaryDecoder {

    private bitCount: number;
    private currentBitIndex: number;

    constructor(public readonly bits: string, startBitIndex: number = 0) {
        this.bitCount = bits.length;
        this.currentBitIndex = startBitIndex;
    }

    copy(): BinaryDecoder {
        return new BinaryDecoder(this.bits, this.currentBitIndex);
    }

    numBitsLeft(): number {
        return this.bitCount - this.currentBitIndex;
    }

    static fromUInt8Array(bytes: Uint8Array): BinaryDecoder {
        let bits = '';

        for (let i = 0; i < bytes.length; i++) {
            bits += bytes[i].toString(2).padStart(8, '0');
        }

        return new BinaryDecoder(bits);
    }

    // returns a string of 0s and 1s
    nextBinaryString(bitCount: number, shift: boolean = true): string {
        if (bitCount < 0) {
            throw new Error("Bit count must be at least 0");
        }

        if (this.currentBitIndex + bitCount > this.bitCount) {
            throw new Error("Not enough bits left");
        }

        const value = this.bits.substring(this.currentBitIndex, this.currentBitIndex + bitCount);
        if (shift) this.currentBitIndex += bitCount;
        return value;
    }

    // returns a new BinaryDecoder with a substring with length bitCount
    nextDecoder(bitCount: number): BinaryDecoder {
        const bits = this.nextBinaryString(bitCount);
        return new BinaryDecoder(bits);
    }


    nextUnsignedInteger(bitCount: number, shift: boolean = true): number {
        return parseInt(this.nextBinaryString(bitCount, shift), 2);
    }

    nextBoolean(): boolean {
        return this.nextUnsignedInteger(1) == 1;
    }

    nextTetrominoType(): TetrominoType {
        return this.nextUnsignedInteger(3);
    }

    nextTetrisBoard(): TetrisBoard {
        const binaryString = this.nextBinaryString(400);

        // convert to base4 by converting each 2 bits to a base4 digit, so that we have 200 base4 digits
        let base4 = '';
        for (let i = 0; i < binaryString.length; i += 2) {
            const value = parseInt(binaryString.substring(i, i + 2), 2);
            base4 += value.toString(4);
        }

        return BinaryTranscoder.decode(base4);

    }

    // 11 bits total
    nextMTPose(): MTPose {
        const r = this.nextUnsignedInteger(2);
        const x = this.nextUnsignedInteger(4) - 2;
        const y = this.nextUnsignedInteger(5) - 2;

        return { r, x, y };
    }

    hasMore(): boolean {
        return this.currentBitIndex < this.bitCount;
    }
}

