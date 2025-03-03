import { OCRState } from "./ocr-state";
import { GlobalState } from "./global-state";
import { StateMachineLogger, TextLogger } from "./state-machine-logger";
import { OCRFrame } from "./ocr-frame";
import { OcrStateFactory as ocrStateFactory } from "./ocr-states/ocr-state-factory";
import { Profiler, ProfilerResults } from "../../shared/scripts/profiler";
import { PacketSender } from "../util/packet-sender";
import { GameDisplayData } from "../../shared/tetris/game-display-data";
import { OCRStateID } from "./ocr-states/ocr-state-id";
import { GameAnalyzer } from "../../shared/evaluation/game-analyzer";
import { BehaviorSubject, Observable } from "rxjs";

export interface OCRConfig {
    startLevel: number | null, // Can only transition to game if OCR detects matching start level
    seed: string | null, // If defined, must set rng to this seed
    multipleGames: boolean, // whether OCR can start another game after first game ends
}

export class OCRStateMachine {

    private currentState$: BehaviorSubject<OCRState>;
    private globalState: GlobalState;

    private profiler = new Profiler();

    private textLogger = new TextLogger();

    // How many state transitions have occurred
    private stateCount: number = 0;

    /**
     * Dependency injection for videoSource and logger allows for easy swapping of inputs.
     * 
     * @param startLevel If the level is specified, the level must match for the game to start
     * @param packetSender Sends packets to the game server, if provided
     * @param logger Logs the state of the OCR machine at each advanceFrame() call
     */
    constructor(
        public readonly config: OCRConfig,
        private readonly packetSender?: PacketSender,
        private readonly analyzerFactory?: (startLevel: number) => GameAnalyzer,
        private readonly logger?: StateMachineLogger,
    ) {
        this.globalState = new GlobalState(this.packetSender, this.analyzerFactory);
        this.currentState$ = new BehaviorSubject<OCRState>(ocrStateFactory(OCRStateID.BEFORE_GAME, this.config, this.globalState, this.textLogger));
    }

    /**
     * Fetches the next frame from the video source, lazily extracts OCR through OCRFrame, and advances OCRState.
     */
    async advanceFrame(ocrFrame: OCRFrame) {

        // Get the next frame from the video source
        this.profiler.start();

        const currentState = this.currentState$.getValue();

        // Advance the current OCR state
        const newStateID = await currentState.advanceState(ocrFrame);
        const eventStatuses = currentState.getEventStatusesThisFrame();

        // Send all the packets that were accumulated this frame
        const packets = this.packetSender?.sendBufferedPackets();

        // Log the current state of the OCR machine
        const logs = this.textLogger.popLogs();
        await this.logger?.log(this.stateCount, ocrFrame, currentState, eventStatuses, packets ?? [], this.globalState, logs);

        // Transition to the new state if needed
        if (newStateID !== undefined) {
            this.stateCount++;
            this.currentState$.next(ocrStateFactory(newStateID, this.config, this.globalState, this.textLogger));
            console.log("Transition to", newStateID);
        }
        
        this.profiler.stop();
    }

    getCurrentState$(): Observable<OCRState> {
        return this.currentState$.asObservable();
    }

    getGameDisplayData(): GameDisplayData {
        return this.globalState.getGameDisplayData();
    }

    getProfilerResults(): ProfilerResults {
        return this.profiler.getResults();
    }
}