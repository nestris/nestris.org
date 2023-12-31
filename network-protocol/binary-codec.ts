import { TetrominoType } from "client/src/app/models/tetris/tetromino-type";

/*
Builder for compact binary encoding. Allows you to add different types of data
and then convert to a string of 0s and 1s and/or a Uint8Array.
*/
export class BinaryEncoder {
    private bits: string = '';
    private bitCount: number = 0;

    constructor() { }

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

        if (value > Math.pow(2, bitCount) - 1) {
            throw new Error("Value is too large for bit count");
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

    private bitCount: number = 0;
    private currentBitIndex: number = 0;

    constructor(public readonly bits: string) {
        this.bitCount = bits.length;
    }

    static fromUInt8Array(bytes: Uint8Array): BinaryDecoder {
        let bits = '';

        for (let i = 0; i < bytes.length; i++) {
            bits += bytes[i].toString(2).padStart(8, '0');
        }

        return new BinaryDecoder(bits);
    }

    // returns a string of 0s and 1s
    nextBinaryString(bitCount: number): string {
        if (bitCount < 1) {
            throw new Error("Bit count must be at least 1");
        }

        if (this.currentBitIndex + bitCount > this.bitCount) {
            throw new Error("Not enough bits left");
        }

        const value = this.bits.substring(this.currentBitIndex, this.currentBitIndex + bitCount);
        this.currentBitIndex += bitCount;
        return value;
    }

    // returns a new BinaryDecoder with a substring with length bitCount
    nextDecoder(bitCount: number): BinaryDecoder {
        const bits = this.nextBinaryString(bitCount);
        return new BinaryDecoder(bits);
    }


    nextUnsignedInteger(bitCount: number): number {
        return parseInt(this.nextBinaryString(bitCount), 2);
    }

    nextBoolean(): boolean {
        return this.nextUnsignedInteger(1) == 1;
    }

    nextTetrominoType(): TetrominoType {
        return this.nextUnsignedInteger(3);
    }

    hasMore(): boolean {
        return this.currentBitIndex < this.bitCount;
    }
}

