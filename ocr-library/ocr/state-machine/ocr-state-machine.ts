import { Calibration } from "ocr/util/calibration";
import { VideoSource } from "./video-source";
import { OCRState } from "./ocr-state";
import { BeforeGameState } from "./ocr-states/before-game-state";
import { GameData } from "./game-data";
import { StateMachineLogger } from "./state-machine-logger";
import { OCRFrame } from "./ocr-frame";
import { OcrStateFactory as ocrStateFactory } from "./ocr-states/ocr-state-factory";
import { Profiler, ProfilerResults } from "../../shared/scripts/profiler";

export class OCRStateMachine {

    private currentState: OCRState;
    private gameData?: GameData;

    private frameProfiler = new Profiler();
    private stateProfiler = new Profiler();

    /**
     * Dependency injection for videoSource and logger allows for easy swapping of inputs.
     * 
     * @param calibration The OCR calibration settings to use
     * @param videoSource Where video source frames are fetched
     * @param logger Logs the state of the OCR machine at each advanceFrame() call
     */
    constructor(
        private readonly calibration: Calibration,
        private readonly videoSource: VideoSource,
        private readonly logger: StateMachineLogger,
    ) {

        this.currentState = new BeforeGameState();

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

        // Transition to the new state if needed
        if (newStateID !== undefined) {
            this.currentState = ocrStateFactory(newStateID);
        }
        this.stateProfiler.stop();

        // Log the current state of the OCR machine
        this.logger.log(ocrFrame, this.currentState, this.gameData);
    }

    getFrameProfilerResults(): ProfilerResults {
        return this.frameProfiler.getResults();
    }

    getStateProfilerResults(): ProfilerResults {
        return this.stateProfiler.getResults();
    }

}