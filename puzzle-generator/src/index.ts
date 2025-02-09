import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";
import { generatePuzzles } from "./generate-puzzles";
import { server } from "./server";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { TETROMINO_CHAR } from "../../shared/tetris/tetrominos";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { decodePuzzle, encodePuzzle } from "../../shared/puzzles/encode-puzzle";
import { addPuzzlesToDatabase } from "./add-puzzles-to-database";


function generate() {

    const NUM_PUZZLES = 5;

    // Store the number of puzzles generated for each rating
    const count: { [key in PuzzleRating]?: number } = {};

    console.log(`Generating ${NUM_PUZZLES} puzzles`);
    const startTime = Date.now();
    generatePuzzles(NUM_PUZZLES).then(async puzzles => {
        puzzles.forEach(puzzle => {
            if (count[puzzle.rating] === undefined) {
                count[puzzle.rating] = 1;
            } else {
                count[puzzle.rating]!++;
            }
        });

        console.log(`Generated ${NUM_PUZZLES} puzzles in ${Date.now() - startTime}ms`);
        for (let [rating, numPuzzles] of Object.entries(count)) {
            console.log(`${rating}: ${numPuzzles}`);
        }

        // save to database
        await addPuzzlesToDatabase(puzzles);
    });
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
    case 'encode-puzzle': return testEncoding();
    default:
        console.error("Invalid mode");
        break;
}})();