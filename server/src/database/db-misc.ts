/**
 * Encode a decimal number into an integer with a fixed number of decimal places.
 * @param num The decimal number to encode
 * @param decimalPlaces The number of decimal places to encode
 */
export function encodeDecimal(num: number, decimalPlaces: number): number {
    return Math.round(num * Math.pow(10, decimalPlaces));
}

/**
 * Decode an integer with a fixed number of decimal places into a decimal number.
 * @param num The integer to decode
 * @param decimalPlaces The number of decimal places to decode
 */
export function decodeDecimal(num: number, decimalPlaces: number): number {
    return num / Math.pow(10, decimalPlaces);
}