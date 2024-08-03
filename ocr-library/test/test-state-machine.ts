import { JsonLogger, SerializedStateMachineFrame } from "../ocr/state-machine/state-machine-logger";
import { TestVideoSource } from "./parse-video";
import { OCRStateMachine } from "../ocr/state-machine/ocr-state-machine";
import { Calibration } from "../ocr/util/calibration";
import { log, error } from "console";

/**
 * Test the state machine with a given testcase, logging the frames and states at each tick.
 * @param testcase The name of the testcase to test
 * @returns The serialized frames and states at each tick
 */
export async function testStateMachine(testcase: string, calibration: Calibration, maxFrames: number | undefined = undefined): Promise<SerializedStateMachineFrame[]> {

    // Initialize the video source
    const videoSource = new TestVideoSource(testcase);
    await videoSource.init();

    // Initialize the logger
    const logger = new JsonLogger();


    // Initialize the state machine
    const stateMachine = new OCRStateMachine(calibration, videoSource, logger);

    // Advance the state machine by one frame for each frame in the video
    if (!maxFrames) maxFrames = videoSource.getNumFrames();
    for (let i = 0; i < Math.min(videoSource.getNumFrames(), maxFrames); i++) {
        await stateMachine.advanceFrame();
        log(`Executed frame ${i}`);
    }

    // Return the serialized frames and states from the state machine logger
    return logger.getSerializedFrames();

}