import { BehaviorSubject, filter, firstValueFrom, Observable } from "rxjs";
import { JsonMessage, JsonMessageType } from "src/app/shared/network/json-message";
import { WebsocketService } from "../websocket.service";
import { Directive, inject, Injectable, OnInit } from "@angular/core";
import { FetchService } from "../fetch.service";

/**
 * An abstract class that manages state that is initially fetched with a GET request, but subscribes to specific websocket
 * events to update the state. It exposes the state as an observable.
 * @template T The type of the state
 */
export abstract class StateService<T> {

    // Inject the websocket service and fetch service
    protected websocketService = inject(WebsocketService);
    protected fetchService = inject(FetchService);

    /**
     * The state, which is initially fetched with a GET request and updated with websocket events
     * The initial state of the service starts as undefined until the fetch is complete
     */
    private state$: BehaviorSubject<T | undefined> = new BehaviorSubject<T | undefined>(undefined);

    /**
     * Store a queue of events that were received before the state was fetched. Once the state is fetched, these events
     * will be processed in order.
     */
    private eventQueue: JsonMessage[] = [];

    /**
     * Fetch the initial state of the service through a GET request
     * @returns The initial state
     */
    protected abstract fetch(): Promise<T>;

    /**
     * Codify how the state should be updated based on each event
     * @param event The event that was received
     * @param state The current state
     * @returns The new state
     */
    protected abstract onEvent(event: JsonMessage, state: T): T;

    /**
     * Start fetching the initial state and subscribe to websocket events
     * @param events The events that the service should listen to in order to update the state
     */
    constructor(events: JsonMessageType[]) {

        // Start fetching the initial state
        this.fetch().then(state => {

            // First, process the event queue for any events that were received before the state was fetched
            this.eventQueue.forEach(event => {
                this.onEvent(event, state);
            });

            // Set the state
            this.state$.next(state);
        });

        // Subscribe to each event
        events.forEach(event => {
            this.websocketService.onEvent(event).subscribe(message => {

                // If the state is not yet fetched, add the event to the queue
                if (this.state$.value === undefined) this.eventQueue.push(message);
                
                else { // Otherwise, process the event and update the state, making a copy to trigger the observable
                    let newState: T = Object.assign({}, this.state$.getValue());
                    newState = this.onEvent(message, newState);
                    this.state$.next(newState);
                }
            });
        });
    }

    /**
     * Get the state as an observable, emitting only when the state is defined
     * @returns The state as an observable
     */
    public get$(): Observable<T> {
        return this.state$.pipe(filter(state => state !== undefined)) as Observable<T>;
    }

     /**
     * Get the current state synchronously if it exists, or wait for the initial fetch to complete
     * @returns A promise that resolves with the state
     * @throws Error if the state is undefined and the fetch fails
     */
     public async get(): Promise<T> {

        // If state is defined, return it
        const currentState = this.state$.getValue();
        if (currentState !== undefined) {
            return currentState;
        }

        // If state is undefined, wait for the first defined value
        return firstValueFrom(this.get$());
    }
}