import { Injector } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { RoomModal } from "src/app/components/layout/room/room/room.component";
import { RoomState } from "src/app/shared/room/room-models";

export abstract class ClientRoom<State extends RoomState = RoomState> {

    private state$: BehaviorSubject<State>;

    constructor(
        protected readonly injector: Injector,
        public readonly modal$: BehaviorSubject<RoomModal | null>,
        initialState: State,
    ) {
        this.state$ = new BehaviorSubject(initialState);
    }

    /**
     * Override this method to perform any initialization logic. Should only be called by the RoomService.
     */
    public async init(): Promise<void> {}

    /**
     * Implement this hook to perform actions when the room state is updated.
     * @param oldState The previous state of the room
     * @param newState The new state of the room
     */
    protected async onStateUpdate(oldState: State, newState: State): Promise<void> {}


    public getState$(): Observable<State> {
        return this.state$.asObservable();
    }

    public getState(): State {
        return this.state$.getValue();
    }

    /**
     * Update the state of the room. Should only be called by the RoomService.
     * @param state The new state of the room
     */
    public async _updateState(state: State) {

        const oldState = this.state$.getValue();
        this.state$.next(state);

        await this.onStateUpdate(oldState, state);
    }

}