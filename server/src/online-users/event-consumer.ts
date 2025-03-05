import { errorHandler } from "../errors/error-handler";
import { OnlineUserEvent, OnlineUserEventType, OnSessionBinaryMessageEvent, OnSessionConnectEvent, OnSessionDisconnectEvent, OnSessionJsonMessageEvent, OnUserActivityChangeEvent, OnUserConnectEvent, OnUserDisconnectEvent, UserEvent } from "./online-user-events";
import { OnlineUserManager } from "./online-user-manager";
import { catchError, concatMap, EMPTY, filter, from, map, Observable, Subject } from "rxjs";

// Consumer events are events that can be sent across different consumers
export enum ConsumerEventType {

}

export abstract class ConsumerEvent {
    abstract readonly type: ConsumerEventType;
}

/**
 * EventConsumers are singletons that listen to events from the OnlineUserManager. Different consumers
 * can communicate with each other by sending and listening to ConsumerEvents.
 */
export class EventConsumer<Config extends {} = {}> {

    private registerEvent<Event extends OnlineUserEvent>(type: OnlineUserEventType, onEvent?: (event: Event) => Promise<void>) {

        if (onEvent) {
            this.users.onEvent$<Event>(type).pipe(
                concatMap(event => 
                    from(onEvent!(event)).pipe(
                        catchError(error => {
                            errorHandler.logError(error, event);
                            return EMPTY;
                        })
                    )
                )
            ).subscribe();
        }
    }

    constructor(
        protected readonly users: OnlineUserManager,
        private readonly consumerEvent$: Subject<ConsumerEvent>,
        protected readonly config: Config,
    ) {
        this.registerEvent<OnUserConnectEvent>(OnlineUserEventType.ON_USER_CONNECT, this.onUserConnect?.bind(this));
        this.registerEvent<OnUserDisconnectEvent>(OnlineUserEventType.ON_USER_DISCONNECT, this.onUserDisconnect?.bind(this));
        this.registerEvent<OnUserActivityChangeEvent>(OnlineUserEventType.ON_USER_ACTIVITY_CHANGE, this.onUserActivityChange?.bind(this));
        this.registerEvent<OnSessionConnectEvent>(OnlineUserEventType.ON_SESSION_CONNECT, this.onSessionConnect?.bind(this));
        this.registerEvent<OnSessionDisconnectEvent>(OnlineUserEventType.ON_SESSION_DISCONNECT, this.onSessionDisconnect?.bind(this));
        this.registerEvent<OnSessionJsonMessageEvent>(OnlineUserEventType.ON_SESSION_JSON_MESSAGE, this.onSessionJsonMessage?.bind(this));
        this.registerEvent<OnSessionBinaryMessageEvent>(OnlineUserEventType.ON_SESSION_BINARY_MESSAGE, this.onSessionBinaryMessage?.bind(this));

    }

    // Override to initialize consumer
    public async init(): Promise<void> {}

    // override methods to handle desired events
    protected async onUserConnect?(event: OnUserConnectEvent) {}
    protected async onUserDisconnect?(event: OnUserDisconnectEvent) {}
    protected async onUserActivityChange?(event: OnUserActivityChangeEvent) {}
    protected async onSessionConnect?(event: OnSessionConnectEvent) {}
    protected async onSessionDisconnect?(event: OnSessionDisconnectEvent) {}
    protected async onSessionJsonMessage?(event: OnSessionJsonMessageEvent) {}
    protected async onSessionBinaryMessage?(event: OnSessionBinaryMessageEvent) {}

    // Emit a consumer event to all consumers
    protected emitConsumerEvent(event: ConsumerEvent) {
        this.consumerEvent$.next(event);
    }

    // Subscribe to consumer events of given type
    // Precondition: ConcreteConsumerEvent must match the type of the event.
    // i.e. onConsumerEvent$<ConcreteConsumerEvent>(ConsumerEventType.CONCRETE_EVENT)
    protected onConsumerEvent$<ConcreteConsumerEvent extends ConsumerEvent>(type: ConsumerEventType): Observable<ConcreteConsumerEvent> {
        return this.consumerEvent$.pipe(
            filter(event => event.type === type),
            map(event => event as ConcreteConsumerEvent)
        );
    }
}

// Managers all consumers of OnlineUserManager and OnlineUserEvents
export class EventConsumerManager {

    // Observable shared by all consumers for consumers to send events to each other
    private consumerEvent$ = new Subject<ConsumerEvent>();

    // Map of consumer class names to consumer instances
    private consumerInstances = new Map<string, EventConsumer>();

    private consumerInitPromises: Promise<void>[] = [];

    // Must be called before using singleton
    public static bootstrap(users: OnlineUserManager) {
        this.instance = new EventConsumerManager(users);
    }

    // Setup singleton instance
    private static instance: EventConsumerManager;
    private constructor(private readonly users: OnlineUserManager) {}
    public static getInstance(): EventConsumerManager {
        if (!this.instance) {
            throw new Error("EventConsumerManager has not been bootstrapped");
        }
        return this.instance;
    }

    // Wait for all consumers to initialize
    public async init(): Promise<void> {
        await Promise.all(this.consumerInitPromises);
        console.log("All consumers initialized");
    }
    

    // Register a new online user event consumer
    // Takes in a class that extends EventConsumer, and creates a new instance of it
    public registerConsumer<C extends {}>(
        eventConsumerClass: new (users: OnlineUserManager, consumerEvent$: Subject<ConsumerEvent>, config: C) => EventConsumer<C>,
        config: C
    ) {

        // Instantiate consumer object
        const consumer = new eventConsumerClass(this.users, this.consumerEvent$, config);
        let initPromise = consumer.init();
        this.consumerInitPromises.push(initPromise);

        // Assert consumer is not already registered
        if (this.consumerInstances.has(eventConsumerClass.name)) {
            throw new Error(`Consumer ${eventConsumerClass.name} is already registered`);
        }

        // Register consumer
        this.consumerInstances.set(eventConsumerClass.name, consumer);
        console.log(`Registered consumer: ${eventConsumerClass.name} ${JSON.stringify(config)}`);
    }

    // Retrieve a specific consumer by class name
    public getConsumer<T extends EventConsumer>(consumerClass: new (...args: any[]) => T): T {
        const consumerClassName = consumerClass.name;

        if (!this.consumerInstances.has(consumerClassName)) {
            throw new Error(`Consumer ${consumerClassName} is not registered`);
        }

        return this.consumerInstances.get(consumerClassName) as T;
    }

    public getUsers(): OnlineUserManager {
        return this.users;
    }
}