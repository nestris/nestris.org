// 7x7 matrix for each digit

import { TextboxResult } from "./text-box";

const ZERO ="..XXX.." + "\n" +
            ".X..XX." + "\n" +
            "XX...XX" + "\n" +
            "XX...XX" + "\n" +
            "XX...XX" + "\n" +
            ".XX..X." + "\n" +
            "..XXX..";

const ONE = "...XX.." + "\n" +
            "..XXX.." + "\n" +
            "...XX.." + "\n" +
            "...XX.." + "\n" +
            "...XX.." + "\n" +
            "...XX.." + "\n" +
            ".XXXXXX";

const TWO = ".XXXXX." + "\n" +
            "XX...XX" + "\n" +
            "....XXX" + "\n" +
            "..XXXX." + "\n" +
            ".XXXX.." + "\n" +
            "XXX...." + "\n" +
            "XXXXXXX"

const THREE = ".XXXXXX" + "\n" +
              "....XX." + "\n" +
              "...XX.." + "\n" +
              "..XXXX." + "\n" +
              ".....XX" + "\n" +
              "XX...XX" + "\n" +
              ".XXXXX."

const digits_STRINGS = [ZERO, ONE, TWO, THREE];
const digitMatrix: boolean[][][] = digits_STRINGS.map((str) => {
  const rows = str.split("\n");
  return rows.map((row) => {
    return row.split("").map((char) => char === "X");
  });
} );

export function getDigitMatrix(digit: number): boolean[][] {
  return digitMatrix[digit];
}


export function getDigitSimilarity(digit: number, image: boolean[][]): number {

  if (image.length !== 7 || image[0].length !== 7) {
    throw new Error("Image must be 7x7");
  }

  const digitMatrix = getDigitMatrix(digit);
  let sum = 0;
  for (let y = 0; y < digitMatrix.length; y++) {
    for (let x = 0; x < digitMatrix[y].length; x++) {
      sum += digitMatrix[y][x] === image[y][x] ? 1 : 0;
    }
  }
  return sum;
}

export function classifyDigit(image: boolean[][]): TextboxResult {

  if (image.length !== 7 || image[0].length !== 7) {
    throw new Error("Image must be 7x7");
  }

  let bestDigit = -1;
  let bestSimilarity = -1;
  for (let i = 0; i < digits_STRINGS.length; i++) {
    const similarity = getDigitSimilarity(i, image);
    if (similarity > bestSimilarity) {
      bestDigit = i;
      bestSimilarity = similarity;
    }
  }

  const confidence = bestSimilarity / 49;

  return {
    value: bestDigit,
    confidence,
  };
}