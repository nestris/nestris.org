import { GlobalState } from "./global-state";
import { OCRFrame } from "./ocr-frame";
import { OCRStateID } from "./ocr-states/ocr-state-id";
import { PersistenceStrategy, SingleFramePersistenceStrategy } from "./persistence-strategy";
import { TextLogger } from "./state-machine-logger";

export interface EventStatus {
    name: string;
    preconditionMet: boolean;
    persistenceMet: boolean;
}

/**
 * Represents the OCR machine in a particular state. Each state holds its own data and logic,
 * and OCRStateMachine determines transitions based on current state and OCRFrame data.
 */
export abstract class OCRState {

    private events: StateEvent[] = [];

    private eventStatuses: EventStatus[] = [];
    private relativeFrameCount = 0;

    constructor(
        public readonly id: OCRStateID,
        public readonly globalState: GlobalState,
        public readonly textLogger: TextLogger
    ) {}

    /**
     * Adds an event to this state. Events define custom logic for transitioning between states when the event
     * precondition is met.
     * @param event The event to add
     */
    protected registerEvent(event: StateEvent): void {
        this.events.push(event);
    }

    /**
     * Checks for any events that should be triggered based on the current OCRFrame and GameData.
     * Events define custom logic for transitioning between states when the event precondition is met.
     * @param ocrFrame The current OCR frame
     * @returns The new state to transition to, or undefined if no transition is needed
     */
    async advanceState(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {    
        this.relativeFrameCount++;    

        // Update this state before checking for events
        this.onAdvanceFrame(ocrFrame);

        // Check for events and trigger the first one that is met
        // And, keep a record of the state of each event for debugging purposes
        this.eventStatuses = [];
        for (const event of this.events) {

            const eventStatus = await event.checkForEvent(ocrFrame);
            this.eventStatuses.push(eventStatus);

            if (eventStatus.persistenceMet) {
                return await event.triggerEvent(ocrFrame);
            }
        }
        return undefined;
    }

    /**
     * @returns The number of frames that have passed since this state was entered. Before advanceState()
     * is first called, this will be 0, and it will increment by 1 each time advanceState() is called.
     */
    getRelativeFrameCount(): number {
        return this.relativeFrameCount;
    }

    /**
     * Returns the status of all events that were checked this frame. Useful for debugging.
     * @returns The status of all events that were checked this frame
     */
    getEventStatusesThisFrame(): EventStatus[] {
        return this.eventStatuses;
    }

    /**
     * Called every tick to update the state of the OCR machine. Override this method to implement
     * custom logic for the state to execute at each frame before checking for events.
     * @param ocrFrame The current OCR frame
     */
    protected onAdvanceFrame(ocrFrame: OCRFrame): void {}

}


export abstract class StateEvent {

    /**
     * StateEvents are initialized at the same time the corresponding OCRState is. They define
     * triggers for transitioning between states based on custom logic using current OCRFrame and GameData. 
     * @param name Display name of the event
     * @param persistence Strategy used for how long precondition=true must persist before the event is
     * triggered. Default is SingleFramePersistenceStrategy, which triggers the event immediately.
     */
    constructor(
        public readonly name: string,
        private readonly persistence: PersistenceStrategy = new SingleFramePersistenceStrategy()
    ) {}

    /**
     * Checks if the event should be triggered based on the current OCRFrame and GameData.
     * The precondition must be met some number of times based on the persistence strategy
     * before the event is triggered.
     * @param ocrFrame 
     * @returns Whether the event should be triggered
     */
    async checkForEvent(ocrFrame: OCRFrame): Promise<EventStatus> {
        const preconditionMet = await this.precondition(ocrFrame);
        const persistenceMet = this.persistence.meetsPersistenceCondition(preconditionMet);
        return { name: this.name, preconditionMet, persistenceMet };
    }

    /**
     * Checks if the precondition for this event is met. Override this method to implement custom logic
     * for whether the event should be triggered.
     * @param ocrFrame The current OCR frame
     * @returns Whether the precondition is met
     */
    protected abstract precondition(ocrFrame: OCRFrame): Promise<boolean>;

    /**
     * Triggers the event and possibly returns the new state to transition to. Override this method
     * to define custom logic for what happens when the event is triggered.
     * @param ocrFrame The current OCR frame
     * @returns The new state to transition to, or undefined if no transition is needed
     */
    abstract triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined>;

}