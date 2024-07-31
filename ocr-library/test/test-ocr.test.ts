import { readdirSync, existsSync, rmdirSync, mkdirSync, writeFileSync } from "fs";
import { dump } from "js-yaml";
import { parseVideo } from "./parse-video";

const TEST_CASE_DIRECTORY = 'test-cases';
const OUTPUT_DIRECTORY = 'test-output';

// The names of all the test case folders in the test-cases directory. Exclude hidden files.
const allTestCases = readdirSync(TEST_CASE_DIRECTORY).filter(testCase =>!testCase.startsWith('.'));

// Iterate over all test cases found in the test-cases directory
for (const testCase of allTestCases) {
    test(`Test case: ${testCase}`, async () => {

        // Parse the video file into frames
        const frames = await parseVideo(`${TEST_CASE_DIRECTORY}/${testCase}/game.mov`, 0, 3);
        console.log(frames.length);

        // Delete test-output directory for this test case, if it exists
        const outputDirectory = `${OUTPUT_DIRECTORY}/${testCase}`;
        if (existsSync(outputDirectory)) rmdirSync(outputDirectory, { recursive: true });

        // Create test-output directory for this test case
        mkdirSync(outputDirectory, { recursive: true });

        // Dump calibrations into yaml file
        const data = { width: 1920, height: 1080 };
        writeFileSync(`${OUTPUT_DIRECTORY}/${testCase}/calibration.yaml`, dump(data));

    });
}


