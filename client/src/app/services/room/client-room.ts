import { Injector } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { RoomModal } from "src/app/components/layout/room/room/room.component";
import { ClientRoomEvent, RoomState } from "src/app/shared/room/room-models";
import { WebsocketService } from "../websocket.service";
import { ClientRoomEventMessage } from "src/app/shared/network/json-message";

export abstract class ClientRoom {

    private state$: BehaviorSubject<RoomState>;

    constructor(
        protected readonly injector: Injector,
        public readonly modal$: BehaviorSubject<RoomModal | null>,
        initialState: RoomState,
    ) {
        this.state$ = new BehaviorSubject(initialState);
    }

    /**
     * Override this method to perform any initialization logic. Should only be called by the RoomService.
     */
    public async init(initialState: RoomState): Promise<void> {}

    /**
     * Override this method to perform any cleanup logic. Should only be called by the RoomService.
     */

    public destroy() {}

    /**
     * Implement this hook to perform actions when the room state is updated.
     * @param oldState The previous state of the room
     * @param newState The new state of the room
     */
    protected async onStateUpdate(oldState: RoomState, newState: RoomState): Promise<void> {}


    public getState$<T extends RoomState>(): Observable<T> {
        return this.state$.asObservable() as Observable<T>;
    }

    public getState<T extends RoomState>(): T {
        return this.state$.getValue() as T;
    }

    /**
     * Update the state of the room. Should only be called by the RoomService.
     * @param state The new state of the room
     */
    public async _updateState(state: RoomState) {

        const oldState = this.state$.getValue();
        this.state$.next(state);

        await this.onStateUpdate(oldState, state);
    }

    /**
     * Send a client room event to the server to the corresponding room in the server.
     * @param event The event to send to the server
     */
    protected sendClientRoomEvent(event: ClientRoomEvent) {
        this.injector.get(WebsocketService).sendJsonMessage(new ClientRoomEventMessage(event));
    }

}