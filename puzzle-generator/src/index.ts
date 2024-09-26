import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";
import { generatePuzzles } from "./generate-puzzles";


function generate() {

    const NUM_PUZZLES = 1000;

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

function test() {
    console.log("Testing");
}

const [, , ...args] = process.argv;
const mode = args.find((arg) => arg.startsWith('--mode='))?.split('=')[1];

(() => {switch (mode) {
    case 'generate': return generate();
    case 'test': return test();
    default:
        console.error("Invalid mode");
        break;
}})();