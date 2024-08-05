import { JsonLogger, SerializedStateMachineFrame } from "../ocr/state-machine/state-machine-logger";
import { TestVideoSource } from "./parse-video";
import { OCRStateMachine } from "../ocr/state-machine/ocr-state-machine";
import { Calibration } from "../ocr/util/calibration";
import { log, error } from "console";
import { PacketSender } from "../ocr/util/packet-sender";
import { BinaryEncoder } from "../shared/network/binary-codec";

export class MockPacketSender extends PacketSender {

    // Mocked sendPacket function does nothing
    sendPacket(packet: BinaryEncoder): void {}
}

/**
 * Test the state machine with a given testcase, logging the frames and states at each tick.
 * @param testcase The name of the testcase to test
 * @returns The serialized frames and states at each tick
 */
export async function testStateMachine(testcase: string, calibration: Calibration, maxFrames: number | undefined = undefined): Promise<SerializedStateMachineFrame[]> {

    // Initialize the video source
    const videoSource = new TestVideoSource(testcase);
    await videoSource.init();

    const logger = new JsonLogger();
    const packetSender = new MockPacketSender();

    // Initialize the state machine
    const stateMachine = new OCRStateMachine(calibration, videoSource, packetSender, logger);

    // Advance the state machine by one frame for each frame in the video
    if (!maxFrames) maxFrames = videoSource.getNumFrames();
    for (let i = 0; i < Math.min(videoSource.getNumFrames(), maxFrames); i++) {
        await stateMachine.advanceFrame();
        log(`Executed frame ${i}`);
    }

    console.log("Frame profiler results (ms):", stateMachine.getFrameProfilerResults());
    console.log("State profiler results (ms):", stateMachine.getStateProfilerResults());

    // Return the serialized frames and states from the state machine logger
    return logger.getSerializedFrames();

}