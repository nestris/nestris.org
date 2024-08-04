import { readdirSync, readFileSync, writeFileSync } from "fs";
import { load, dump } from "js-yaml";
import { TestVideoSource } from "./parse-video";
import { calibrate } from "../ocr/calibration/calibrate";
import { testStateMachine } from "./test-state-machine";
import { Calibration } from "../ocr/util/calibration";

const TEST_CASE_DIRECTORY = 'test-cases';
const OUTPUT_DIRECTORY = 'test-output';

// Interface for config.yaml files
interface Config {
    calibration: {
        frame: number;
        x: number;
        y: number;
    };
    verification: {
        start: {
            level: number;
            currentPiece: string;
            nextPiece: string;
        },
        end: {
            level: number;
            lines: number;
            score: number;
        }
    };
}

/**
 * Run all test cases in the test-cases directory. For each test case, parse the video file, calibrate on the
 * specified frame, save the calibration data, run OCR on the video, verify the results, and save results to test-output.
 */
async function runTestCases() {

    // Iterate over all test cases found in the test-cases directory
    for (const testCase of allTestCases) {

        const videoPath = `${TEST_CASE_DIRECTORY}/${testCase}/game.mov`;
        const outputDirectory = `${OUTPUT_DIRECTORY}/${testCase}`;
        const calibrationOutputPath = `${OUTPUT_DIRECTORY}/${testCase}/calibration.yaml`;
        const calibrationPlusOutputPath = `${OUTPUT_DIRECTORY}/${testCase}/calibration-plus.yaml`;

        // Run all calibrate testcases with `npm test -- -t calibrate`
        test(`calibrate-${testCase}`, async () => {

            // Get the test case configuration, which contains info on calibration and verification
            const config = load(readFileSync(`${TEST_CASE_DIRECTORY}/${testCase}/config.yaml`, 'utf8')) as Config;
            console.log(config.calibration);

            console.log(`Calibrating on frame ${config.calibration.frame}...`);

            // Get the frame to be used for calibration based on the config
            const videoSource = new TestVideoSource(testCase);
            await videoSource.init();
            const calibrationFrame = await videoSource.getFrame(config.calibration.frame);

            // Calibrate on the specified frame
            const [calibration, calibrationPlus] = calibrate(calibrationFrame, config.calibration.frame, {
                x: config.calibration.x, y: config.calibration.y
            });

            // Save the calibration and calibration plus data to the output directory
            writeFileSync(calibrationOutputPath, dump(calibration));
            writeFileSync(calibrationPlusOutputPath, dump(calibrationPlus));

            console.log(`Calibration set to ${JSON.stringify(calibration, null, 2)}`);
        });

        // Run all ocr testcases with `npm test -- -t ocr`
        test(`ocr-${testCase}`, async () => {

            // Get the calibration data from the output directory
            const calibration = load(readFileSync(calibrationOutputPath, 'utf8')) as Calibration;

            // Run the full OCR state machine on the test case
            const testResults = await testStateMachine(testCase, calibration);

            // Save the test results to the output directory
            writeFileSync(`${outputDirectory}/test-results.yaml`, dump(testResults));
        }, 600000); // Set timeout to 10 minutes
    }

}

// The names of all the test case folders in the test-cases directory. Exclude hidden files.
const allTestCases = readdirSync(TEST_CASE_DIRECTORY).filter(testCase =>!testCase.startsWith('.'));

// Run the test cases
(async () => runTestCases())();