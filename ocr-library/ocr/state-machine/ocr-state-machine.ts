import { Calibration } from "../util/calibration";
import { VideoSource } from "./video-source";
import { OCRState } from "./ocr-state";
import { BeforeGameState } from "./ocr-states/before-game-state";
import { GlobalState } from "./global-state";
import { StateMachineLogger, TextLogger } from "./state-machine-logger";
import { OCRFrame } from "./ocr-frame";
import { OcrStateFactory as ocrStateFactory } from "./ocr-states/ocr-state-factory";
import { Profiler, ProfilerResults } from "../../shared/scripts/profiler";
import { PacketSender } from "../util/packet-sender";
import { GameDisplayData } from "../../shared/tetris/game-display-data";

export class OCRStateMachine {

    private currentState: OCRState;
    private globalState: GlobalState;

    private frameProfiler = new Profiler();
    private stateProfiler = new Profiler();

    private textLogger = new TextLogger();

    // How many state transitions have occurred
    private stateCount: number = 0;

    /**
     * Dependency injection for videoSource and logger allows for easy swapping of inputs.
     * 
     * @param calibration The OCR calibration settings to use
     * @param videoSource Where video source frames are fetched
     * @param packetSender Sends packets to the game server
     * @param logger Logs the state of the OCR machine at each advanceFrame() call
     */
    constructor(
        private readonly calibration: Calibration,
        private readonly videoSource: VideoSource,
        private readonly packetSender: PacketSender,
        private readonly logger: StateMachineLogger,
    ) {
        this.globalState = new GlobalState(this.packetSender);
        this.currentState = new BeforeGameState(this.globalState, this.textLogger);
    }

    /**
     * Fetches the next frame from the video source, lazily extracts OCR through OCRFrame, and advances OCRState.
     */
    async advanceFrame() {

        // Get the next frame from the video source
        this.frameProfiler.start();
        const rawFrame = await this.videoSource.getNextFrame();
        const ocrFrame = new OCRFrame(rawFrame, this.calibration);
        this.frameProfiler.stop();

        // Advance the current OCR state
        this.stateProfiler.start();
        const newStateID = this.currentState.advanceState(ocrFrame);
        const eventStatuses = this.currentState.getEventStatusesThisFrame();
        this.stateProfiler.stop();

        // Send all the packets that were accumulated this frame
        const packets = this.packetSender.sendBufferedPackets();

        // Log the current state of the OCR machine
        this.logger.log(this.stateCount, ocrFrame, this.currentState, eventStatuses, packets, this.globalState, this.textLogger.popLogs());

        // Transition to the new state if needed
        if (newStateID !== undefined) {
            this.stateCount++;
            this.currentState = ocrStateFactory(newStateID, this.globalState, this.textLogger);
        }
    }

    getGameDisplayData(): GameDisplayData {
        return this.globalState.getGameDisplayData();
    }

    getFrameProfilerResults(): ProfilerResults {
        return this.frameProfiler.getResults();
    }

    getStateProfilerResults(): ProfilerResults {
        return this.stateProfiler.getResults();
    }

}