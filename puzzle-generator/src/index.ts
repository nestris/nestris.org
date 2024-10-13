import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";
import { generatePuzzles } from "./generate-puzzles";
import { server } from "./server";
import { calculateProbabilities } from "../../server/src/puzzle-generation/select-puzzle";
import { test, test2 } from "./test";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { decodePuzzle, encodePuzzle } from "../../shared/puzzles/encode-puzzle";
import { TETROMINO_CHAR } from "../../shared/tetris/tetrominos";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";


function generate() {

    const NUM_PUZZLES = 2;

    // Store the number of puzzles generated for each rating
    const count: { [key in PuzzleRating]?: number } = {};

    console.log(`Generating ${NUM_PUZZLES} puzzles`);
    generatePuzzles(NUM_PUZZLES).then(puzzles => {
        puzzles.forEach(puzzle => {
            if (count[puzzle.rating] === undefined) {
                count[puzzle.rating] = 1;
            } else {
                count[puzzle.rating]!++;
            }
        });

        console.log("Puzzles generated:");
        for (let [rating, numPuzzles] of Object.entries(count)) {
            console.log(`${rating}: ${numPuzzles}`);
        }
    });
}

function testElo() {
    for (let i = 0; i <= 5000; i += 100) {
        console.log(`Elo ${i}:`, calculateProbabilities(i).map(p => p.toFixed(2)));
    }
}

function testEncoding() {

    const MT = new MoveableTetromino(TetrominoType.Z_TYPE, 3, -2, 15);
    MT.print();

    const int2 = MT.getInt2();
    console.log(int2);

    const MT2 = MoveableTetromino.fromInt2(int2);
    MT2.print();

    const board = TetrisBoard.random();
    const current = TetrominoType.I_TYPE;
    const next = TetrominoType.J_TYPE;

    board.print();

    const encodedPuzzle = encodePuzzle(board, current, next);
    const { board: board2, current: current2, next: next2 } = decodePuzzle(encodedPuzzle);

    board2.print();
    console.log(TETROMINO_CHAR[current], TETROMINO_CHAR[next]);


}

const [, , ...args] = process.argv;
const mode = args.find((arg) => arg.startsWith('--mode='))?.split('=')[1];

(() => {switch (mode) {
    case 'generate': return generate();
    case 'server': return server();
    case 'elo': return testElo();
    case 'encode-puzzle': return testEncoding();
    case 'test': return test2();
    default:
        console.error("Invalid mode");
        break;
}})();