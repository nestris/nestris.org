import { GameData } from "./game-data";
import { OCRFrame } from "./ocr-frame";
import { OCRStateID } from "./ocr-states/ocr-state-id";
import { PersistenceStrategy } from "./persistence-strategy";

/**
 * Represents the OCR machine in a particular state. Each state holds its own data and logic,
 * and OCRStateMachine determines transitions based on current state and OCRFrame data.
 */
export abstract class OCRState {

    constructor(
        public readonly id: OCRStateID,
        protected readonly events: StateEvent[] = [],
    ) {}

    /**
     * Checks for any events that should be triggered based on the current OCRFrame and GameData.
     * Events define custom logic for transitioning between states when the event precondition is met.
     * @param gameData The current game data
     * @param ocrFrame The current OCR frame
     * @returns The new state to transition to, or undefined if no transition is needed
     */
    advanceState(gameData: GameData | undefined, ocrFrame: OCRFrame): OCRStateID | undefined {

        // Update this state before checking for events
        this.onAdvanceFrame(gameData, ocrFrame);

        // Check for events and trigger the first one that is met
        for (const event of this.events) {
            if (event.checkForEvent(ocrFrame, gameData)) {
                return event.triggerEvent(ocrFrame, gameData);
            }
        }
        return undefined;
    }

    /**
     * Called every tick to update the state of the OCR machine. Override this method to implement
     * custom logic for the state to execute at each frame before checking for events.
     * @param gameData The current game data
     * @param ocrFrame The current OCR frame
     */
    protected onAdvanceFrame(gameData: GameData | undefined, ocrFrame: OCRFrame): void {}

}


export abstract class StateEvent {

    constructor(
        private readonly persistence: PersistenceStrategy
    ) {}

    /**
     * Checks if the event should be triggered based on the current OCRFrame and GameData.
     * The precondition must be met some number of times based on the persistence strategy
     * before the event is triggered.
     * @param ocrFrame 
     * @param gameData 
     * @returns Whether the event should be triggered
     */
    checkForEvent(ocrFrame: OCRFrame, gameData: GameData | undefined): boolean {
        const preconditionMet = this.precondition(ocrFrame, gameData);
        return this.persistence.meetsPersistenceCondition(preconditionMet);
    }

    /**
     * Triggers the event and possibly returns the new state to transition to. Override this method
     * to define custom logic for what happens when the event is triggered.
     * @param ocrFrame The current OCR frame
     * @param gameData The current game data
     * @returns The new state to transition to, or undefined if no transition is needed
     */
    abstract triggerEvent(ocrFrame: OCRFrame, gameData: GameData | undefined): OCRStateID | undefined;

    /**
     * Checks if the precondition for this event is met. Override this method to implement custom logic
     * for whether the event should be triggered.
     * @param ocrFrame The current OCR frame
     * @param gameData The current game data
     * @returns Whether the precondition is met
     */
    protected abstract precondition(ocrFrame: OCRFrame, gameData: GameData | undefined): boolean;

}