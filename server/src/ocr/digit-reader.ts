import * as fs from 'fs';
import * as path from 'path';

// Function to convert ASCII art block to BigInt
function asciiArtToString(asciiArt: string): string {
    const binaryString = asciiArt.split('\n').map(line =>
        line.replace(/X/g, '1').replace(/\./g, '0')
    ).join('');

    return binaryString;
}

// Function to read the file and convert ASCII art to BigInts
async function readAsciiArtFromFile(digit: number): Promise<string[]> {

  const filePath = path.join(__dirname, `../../../public/assets/digits/${digit}.txt`); // Update with actual file path

  const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
  const blocks = fileContent.split('\n\n').filter((block: string) => block.trim() !== '');
  return blocks.map(asciiArtToString);
}

async function readAllDigits(): Promise<string[][]> {
  const digits = [];
  for (let i = 0; i < 10; i++) {
    digits.push(await readAsciiArtFromFile(i));
  }
  return digits;
}

let ALL_DIGITS: string[][] = [];

export async function initOCRDigits() {
  ALL_DIGITS = await readAllDigits();
}

export function getOCRDigits(): string[][] {
  return ALL_DIGITS;
}