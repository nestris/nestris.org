// npx ts-node digit-classifier/generate-dataset.ts 

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { load, dump } from "js-yaml";
import { Calibration } from "../ocr/util/calibration";
import { OCRFrame } from "../ocr/state-machine/ocr-frame";
import { TestVideoSource } from "../test/parse-video";
import { PermutationIterator } from "../shared/scripts/permutation-iterator";

const TEST_CASE_DIRECTORY = 'test-cases';
const OUTPUT_DIRECTORY = 'test-output';
const DIGIT_DATASET = 'digit-classifier/digit-dataset';

async function generateDataset() {
    console.log("start", allTestCases);
    const dataset: {[key in string] : number[][][]} = {};

    for (const testCase of allTestCases) {
        
        const calibrationOutputPath = `${OUTPUT_DIRECTORY}/${testCase}/calibration.yaml`;
        const trainingPath = `${TEST_CASE_DIRECTORY}/${testCase}/train.txt`;
    
        if (!existsSync(trainingPath)) {
            console.log("dne", trainingPath);
            continue;
        }

        console.log(`Training ${testCase}`);

        // Get the calibration data from the output directory
        const calibration = load(readFileSync(calibrationOutputPath, 'utf8')) as Calibration;

        const videoSource = new TestVideoSource(testCase);
        await videoSource.init();

        const variations = new PermutationIterator();
        variations.register("threshold", 90, 140, 5);
        variations.register("top", -2, 2);
        variations.register("left", -2, 2);
        variations.register("right", -2, 2);
        variations.register("bottom", -2, 2);

        const training = readFileSync(trainingPath, 'utf8');
        for (let line of training.split("\n")) {
            const [frameIndex, score] = line.split(" ").map(str => parseInt(str));
            const stringScore = score.toString().padStart(6, '0');
            console.log(frameIndex, score);

            const rawFrame = await videoSource.getFrame(frameIndex);
            const ocrFrame = new OCRFrame(rawFrame, calibration);
            for (let index = 0; index < stringScore.length; index++) {

                for (const variation of variations.iterate()) {
                    //console.log(`variation: ${JSON.stringify(variation, null, 2)}`);
                    const matrix = ocrFrame.scoreOCRBox.getDigitMatrix(index, rawFrame, variation.threshold, {
                        top: variation.top,
                        left: variation.left,
                        right: variation.right,
                        bottom: variation.bottom
                    });

                    const digit = stringScore[index];

                    if (!(digit in dataset)) dataset[digit] = [];
                    dataset[digit].push(matrix);
                } 
            }   
        }
    }

    console.log("hello");
    for (let digit = 0; digit < 10; digit++) {
        if (!(digit in dataset)) continue;
        console.log(`${digit}: ${dataset[digit].length}`);
    }
    for (let digit = 0; digit < 10; digit++) {
        if (!(digit in dataset)) continue;
        writeFileSync(`${DIGIT_DATASET}/${digit}.json`, JSON.stringify(dataset[digit]));
    }
    
}

// The names of all the test case folders in the test-cases directory. Exclude hidden files.
const allTestCases = readdirSync(TEST_CASE_DIRECTORY).filter(testCase =>!testCase.startsWith('.'));

console.log("test");
(async () => generateDataset())();