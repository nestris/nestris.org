import { BehaviorSubject, filter, firstValueFrom, Observable } from "rxjs";
import { JsonMessage, JsonMessageType } from "src/app/shared/network/json-message";
import { WebsocketService } from "../websocket.service";
import { Directive, inject, Injectable, OnInit } from "@angular/core";
import { FetchService } from "../fetch.service";

export interface StateChange<T> {
    before: T;
    after: T;
    event: JsonMessage;
}

/**
 * An abstract class that manages state that is initially fetched with a GET request, but subscribes to specific websocket
 * events to update the state. It exposes the state as an observable.
 * @template T The type of the state
 */
export function StateService<T extends {}>() {

    abstract class StateService {

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
         * Keep a list of subscriptions for changes to the state
         */
        private subscriptions:  ((change: StateChange<T>) => void)[] = [];

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
         * Codify what should happen when the state is fetched
         * @param state The current state
         */
        protected onFetch(state: T) {};

        /**
         * Codify what should happen when the state is updated
         * @param state The current state
         */
        protected onUpdate(state: T) {};
        

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

                // Call the onFetch method
                this.onFetch(state);
            });

            // Subscribe to each event
            events.forEach(event => {
                this.websocketService.onEvent(event).subscribe(message => {

                    // If the state is not yet fetched, add the event to the queue
                    if (this.state$.value === undefined) this.eventQueue.push(message);
                    
                    else { // Otherwise, process the event and update the state, making a copy to trigger the observable

                        // get copy of state before update
                        const before = Object.assign({}, this.state$.getValue()!);

                        const newState = this.onEvent(message, this.state$.getValue()!);
                        this.state$.next(newState);

                        // Call the onUpdate method
                        this.onUpdate(newState);

                        // Notify all subscriptions
                        this.subscriptions.forEach(subscription => {
                            subscription({
                                before: before,
                                after: newState,
                                event: message
                            });
                        });
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

        /**
         * Subscribe to changes in the state
         * @param callback The function to call when the state changes
         */
        public onChange(callback: (change: StateChange<T>) => void) {
            this.subscriptions.push(callback);
        }
    }

    return StateService;
}