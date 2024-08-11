import { OCRState } from "./ocr-state";
import { BeforeGameState } from "./ocr-states/before-game-state";
import { GlobalState } from "./global-state";
import { StateMachineLogger, TextLogger } from "./state-machine-logger";
import { OCRFrame } from "./ocr-frame";
import { OcrStateFactory as ocrStateFactory } from "./ocr-states/ocr-state-factory";
import { Profiler, ProfilerResults } from "../../shared/scripts/profiler";
import { PacketSender } from "../util/packet-sender";
import { GameDisplayData } from "../../shared/tetris/game-display-data";
import { OCRStateID } from "./ocr-states/ocr-state-id";

export class OCRStateMachine {

    private currentState: OCRState;
    private globalState: GlobalState;

    private profiler = new Profiler();

    private textLogger = new TextLogger();

    // How many state transitions have occurred
    private stateCount: number = 0;

    /**
     * Dependency injection for videoSource and logger allows for easy swapping of inputs.
     * 
     * @param startLevel If the level is specified, the level must match for the game to start
     * @param packetSender Sends packets to the game server
     * @param logger Logs the state of the OCR machine at each advanceFrame() call
     */
    constructor(
        private readonly startLevel: number | null,
        private readonly packetSender: PacketSender,
        private readonly logger?: StateMachineLogger,
    ) {
        this.globalState = new GlobalState(this.packetSender);
        this.currentState = new BeforeGameState(startLevel, this.globalState, this.textLogger);
    }

    /**
     * Fetches the next frame from the video source, lazily extracts OCR through OCRFrame, and advances OCRState.
     */
    async advanceFrame(ocrFrame: OCRFrame) {

        // Get the next frame from the video source
        this.profiler.start();

        // Advance the current OCR state
        const newStateID = this.currentState.advanceState(ocrFrame);
        const eventStatuses = this.currentState.getEventStatusesThisFrame();

        // Send all the packets that were accumulated this frame
        const packets = this.packetSender.sendBufferedPackets();

        // Log the current state of the OCR machine
        const logs = this.textLogger.popLogs();
        this.logger?.log(this.stateCount, ocrFrame, this.currentState, eventStatuses, packets, this.globalState, logs);

        // Transition to the new state if needed
        if (newStateID !== undefined) {
            this.stateCount++;
            this.currentState = ocrStateFactory(newStateID, this.globalState, this.textLogger);
            console.log("Transition to", newStateID);
        }
        
        this.profiler.stop();
    }

    getCurrentState(): OCRStateID {
        return this.currentState.id;
    }

    getGameDisplayData(): GameDisplayData {
        return this.globalState.getGameDisplayData();
    }

    getProfilerResults(): ProfilerResults {
        return this.profiler.getResults();
    }
}