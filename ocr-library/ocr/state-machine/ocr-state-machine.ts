import { Calibration } from "ocr/util/calibration";
import { VideoSource } from "./video-source";
import { OCRState } from "./ocr-state";
import { BeforeGameState } from "./ocr-states/before-game-state";
import { GameData } from "./game-data";
import { StateMachineLogger } from "./state-machine-logger";
import { OCRFrame } from "./ocr-frame";
import { OcrStateFactory as ocrStateFactory } from "./ocr-states/ocr-state-factory";
import { Profiler, ProfilerResults } from "../../shared/scripts/profiler";
import { PacketSender } from "ocr/util/packet-sender";

export class OCRStateMachine {

    private currentState: OCRState;
    private gameData: GameData;

    private frameProfiler = new Profiler();
    private stateProfiler = new Profiler();

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

        this.currentState = new BeforeGameState();
        this.gameData = new GameData(this.packetSender);

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
        const newStateID = this.currentState.advanceState(this.gameData, ocrFrame);
        const eventStatuses = this.currentState.getEventStatusesThisFrame();
        this.stateProfiler.stop();

        // Send all the packets that were accumulated this frame
        const packets = this.packetSender.sendBufferedPackets();

        // Log the current state of the OCR machine
        this.logger.log(ocrFrame, this.currentState, eventStatuses, packets, this.gameData);

        // Transition to the new state if needed
        if (newStateID !== undefined) {
            this.currentState = ocrStateFactory(newStateID);
        }
    }

    getFrameProfilerResults(): ProfilerResults {
        return this.frameProfiler.getResults();
    }

    getStateProfilerResults(): ProfilerResults {
        return this.stateProfiler.getResults();
    }

}