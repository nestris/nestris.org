export class Base62Encoder {
    private static readonly charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    // Encodes a Uint8Array into a base-62 alphanumeric string.
    static encode(input: Uint8Array): string {
        let output = "";
        let num = BigInt("0x" + [...input].map(byte => byte.toString(16).padStart(2, "0")).join(""));

        while (num > 0) {
            const remainder = num % BigInt(62);
            output = this.charset[Number(remainder)] + output;
            num = num / BigInt(62);
        }

        // Encode the length of the original array as a fixed 4-character base-62 prefix
        const lengthPrefix = this.encodeBase62(input.length, 4);
        return lengthPrefix + output;
    }

    // Helper function to encode a number into a base-62 string with a fixed length
    private static encodeBase62(value: number, length: number): string {
        let result = "";
        let num = BigInt(value);

        while (num > 0) {
            const remainder = num % BigInt(62);
            result = this.charset[Number(remainder)] + result;
            num = num / BigInt(62);
        }

        // Pad the result with leading zeros to meet the desired length
        return result.padStart(length, '0');
    }

    // Decodes a base-62 alphanumeric string back into a Uint8Array.
    static decode(input: string): Uint8Array {
        const lengthPrefix = input.slice(0, 4); // Extract the 4-character length prefix
        const encodedData = input.slice(4); // The actual encoded data part
        const byteLength = this.decodeBase62(lengthPrefix);

        let num = BigInt(0);
        for (let char of encodedData) {
            num = num * BigInt(62) + BigInt(this.charset.indexOf(char));
        }

        const hexString = num.toString(16).padStart(byteLength * 2, "0");
        const byteArray = new Uint8Array(byteLength);

        for (let i = 0; i < byteLength; i++) {
            byteArray[i] = parseInt(hexString.slice(i * 2, i * 2 + 2), 16);
        }

        return byteArray;
    }

    // Helper function to decode a base-62 string back into a number
    private static decodeBase62(input: string): number {
        let result = BigInt(0);

        for (let char of input) {
            result = result * BigInt(62) + BigInt(this.charset.indexOf(char));
        }

        return Number(result);
    }
}
