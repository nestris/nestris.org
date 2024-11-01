import { OnlineUserEventType, OnSessionBinaryMessageEvent, OnSessionConnectEvent, OnSessionDisconnectEvent, OnSessionJsonMessageEvent, OnUserConnectEvent, OnUserDisconnectEvent } from "./online-user-events";
import { OnlineUserManager } from "./online-user-manager";
import { filter, map, Observable, Subject } from "rxjs";

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
export class EventConsumer {

    constructor(
        protected readonly users: OnlineUserManager,
        private readonly consumerEvent$: Subject<ConsumerEvent>
    ) {
        
        // Only subscribe to events that have been implemented by the subclass
        if (this.onUserConnect) {
            this.users.onEvent$<OnUserConnectEvent>(OnlineUserEventType.ON_USER_CONNECT)
                .subscribe(event => this.onUserConnect!(event).catch(console.error));
        }
        if (this.onUserDisconnect) {
            this.users.onEvent$<OnUserDisconnectEvent>(OnlineUserEventType.ON_USER_DISCONNECT)
                .subscribe(event => this.onUserDisconnect!(event).catch(console.error));
        }
        if (this.onSessionConnect) {
            this.users.onEvent$<OnSessionConnectEvent>(OnlineUserEventType.ON_SESSION_CONNECT)
                .subscribe(event => this.onSessionConnect!(event).catch(console.error));
        }
        if (this.onSessionDisconnect) {
            this.users.onEvent$<OnSessionDisconnectEvent>(OnlineUserEventType.ON_SESSION_DISCONNECT)
                .subscribe(event => this.onSessionDisconnect!(event).catch(console.error));
        }
        if (this.onSessionJsonMessage) {
            this.users.onEvent$<OnSessionJsonMessageEvent>(OnlineUserEventType.ON_SESSION_JSON_MESSAGE)
                .subscribe(event => this.onSessionJsonMessage!(event).catch(console.error));
        }
        if (this.onSessionBinaryMessage) {
            this.users.onEvent$<OnSessionBinaryMessageEvent>(OnlineUserEventType.ON_SESSION_BINARY_MESSAGE)
                .subscribe(event => this.onSessionBinaryMessage!(event).catch(console.error));
        }
    }

    // Override to initialize consumer
    public init() {}

    // override methods to handle desired events
    protected async onUserConnect?(event: OnUserConnectEvent) {}
    protected async onUserDisconnect?(event: OnUserDisconnectEvent) {}
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
    

    // Register a new online user event consumer
    // Takes in a class that extends EventConsumer, and creates a new instance of it
    public registerConsumer(
        eventConsumerClass: new (users: OnlineUserManager, consumerEvent$: Subject<ConsumerEvent>) => EventConsumer
    ) {

        // Instantiate consumer object
        const consumer = new eventConsumerClass(this.users, this.consumerEvent$);
        consumer.init();

        // Assert consumer is not already registered
        if (this.consumerInstances.has(eventConsumerClass.name)) {
            throw new Error(`Consumer ${eventConsumerClass.name} is already registered`);
        }

        // Register consumer
        this.consumerInstances.set(eventConsumerClass.name, consumer);
        console.log(`Registered consumer: ${eventConsumerClass.name}`);
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