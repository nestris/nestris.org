import { Injectable } from '@angular/core';
import { TextboxResult } from 'src/app/models/ocr/text-box';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';


@Injectable({
  providedIn: 'root'
})
export class OcrDigitService {

  private digits: bigint[][] = [];

  constructor() { }

  // fetch digit strings from server and convert to BigInts
  async init() {

    const digitStrings = await fetchServer2<string[][]>(Method.GET, "/api/v2/ocr-digits");

    this.digits = digitStrings.map(digitString => digitString.map(digit => BigInt('0b' + digit)));
    console.log("Digits", this.digits);
  }


  private popcount(x: bigint) {
    const mask1 = 0b0101010101010101010101010101010101010101010101010101010101010101n;
    const mask2 = 0b0011001100110011001100110011001100110011001100110011001100110011n;
    const mask3 = 0b0000111100001111000011110000111100001111000011110000111100001111n;
    const mask4 = 0b0000000011111111000000001111111100000000111111110000000011111111n;
    const mask5 = 0b0000000000000000111111111111111100000000000000001111111111111111n;
    let count = 0n;

    while (x > 0n) {
        // Count bits in blocks of 64 using masks
        let t = x & mask1;
        t += (x >> 1n) & mask1;
        t = (t & mask2) + ((t >> 2n) & mask2);
        t = (t & mask3) + ((t >> 4n) & mask3);
        t = (t & mask4) + ((t >> 8n) & mask4);
        t = (t & mask5) + ((t >> 16n) & mask5);
        count += (t + (t >> 32n)) & 0b11111111111111111111111111111111n;

        // Shift by 64 bits
        x >>= 64n;
    }

    return Number(count);
  }


  private hammingDistance(a: bigint, b: bigint) {
    return this.popcount(a ^ b);
  }

  ocrDigit(image: boolean[][]): {
    digit: number,
    confidence: number,
  } {
  
    const imageBigInt = BigInt('0b' + image.map(row => row.map(cell => cell ? '1' : '0').join('')).join(''));

    let bestDigit = -1;
    let bestConfidence = 0;

    for (let digit = 0; digit < this.digits.length; digit++) {
      for (let variant = 0; variant < this.digits[digit].length; variant++) {
        const confidence = 1 - this.hammingDistance(this.digits[digit][variant], imageBigInt) / 64;
        if (confidence > bestConfidence) {
          bestDigit = digit;
          bestConfidence = confidence;
        }
      }
    }

    return {
      digit: bestDigit,
      confidence: bestConfidence,
    };

  }
  
  ocrDigits(image: boolean[][][]): TextboxResult {
    const digits = image.map(image => this.ocrDigit(image).digit);
    const confidence = digits.reduce((acc, digit, i) => acc + this.ocrDigit(image[i]).confidence, 0) / digits.length;
    const digitsCombined = digits.reduce((acc, digit) => acc * 10 + digit, 0);
    return {value: digitsCombined, confidence};
  }

}
