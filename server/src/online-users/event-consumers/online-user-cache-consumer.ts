import { OnlineUserCache } from "../../online-user-cache/online-user-cache";
import { EventConsumer } from "../event-consumer";
import { OnUserConnectEvent, OnUserDisconnectEvent } from "../online-user-events";

interface CacheInfo {
    cache: OnlineUserCache;
    expirationSeconds: number;
}

/**
 * Manages all the defined OnlineUserCaches, reacting to user connect and disconnect events and calling
 * the appropriate fetch and free handlers for each cache.
 */
export class OnlineUserCacheConsumer extends EventConsumer {

    // Map of cache name -> { cache instance, expirationSeconds }
    private readonly caches = new Map<string, CacheInfo>();

    // Map of cache name -> (Map of userid -> setTimeout handle)
    private readonly disconnectTimers = new Map<string, Map<string, NodeJS.Timeout>>();

    /**
     * Registers a cache to be managed by the consumer
     * @param cache The class (constructor) of the OnlineUserCache to register
     * @param expirationSeconds The number of seconds to wait before expiring the cache
     */
    public registerCache(cache: new () => OnlineUserCache, expirationSeconds: number = 60) {
        const cacheInstance = new cache();

        if (this.caches.has(cacheInstance.constructor.name)) {
            throw new Error(`Cache with name ${cacheInstance.constructor.name} already registered`);
        }

        this.caches.set(cacheInstance.constructor.name, { cache: cacheInstance, expirationSeconds });
        console.log(`Registered cache ${cacheInstance.constructor.name} with expiration ${expirationSeconds}s`);
    }

    /**
     * Fetches the data for the user for a given cache
     * @param cache The cache class to fetch data for
     * @param userid The userid of the user to fetch data for
     * @returns The data for the user
     */
    public async get<T>(cache: new () => OnlineUserCache<T>, userid: string): Promise<T> {
        const cacheInstance = this.caches.get(cache.name);
        if (!cacheInstance) {
            throw new Error(`Cache with name ${cache.name} not registered`);
        }

        return await cacheInstance.cache.fetch(userid);
    }

    /**
     * Updates the cache for the user with the given event
     * @param cache The cache class to update data for
     * @param userid The userid of the user to update the cache for
     * @param event The event to update the cache with
     */
    public update<T, Event>(cache: new () => OnlineUserCache<T, Event>, userid: string, event: Event) {
        const cacheInstance = this.caches.get(cache.name);
        if (!cacheInstance) {
            throw new Error(`Cache with name ${cache.name} not registered`);
        }

        cacheInstance.cache.update(userid, event);
    }

    /**
     * When a user connects, start fetching data for all caches for that user.
     * Also clear any pending disconnect timer for that user (so we don't expire).
     */
    protected override async onUserConnect(event: OnUserConnectEvent): Promise<void> {
        for (const [cacheName, { cache, expirationSeconds }] of this.caches.entries()) {

            // Clear any pending expiration timer for this user+cache
            if (!this.disconnectTimers.has(cacheName)) {
                this.disconnectTimers.set(cacheName, new Map());
            }
            const userTimers = this.disconnectTimers.get(cacheName)!;
            if (userTimers.has(event.userid)) {
                clearTimeout(userTimers.get(event.userid));
                userTimers.delete(event.userid);
            }

            // Optionally, start (or continue) prefetching
            cache.fetch(event.userid).catch((error) => {
                console.error(
                    `Error fetching data for cache ${cache.constructor.name} ` +
                    `for user ${event.userid}: ${error}`
                );
            });
        }
    }

    /**
     * When a user disconnects, schedule an expiration for all caches for that user after `expirationSeconds`.
     * If the user reconnects before that timeout fires, we'll clear the timeout in onUserConnect().
     */
    protected override async onUserDisconnect(event: OnUserDisconnectEvent): Promise<void> {
        for (const [cacheName, { cache, expirationSeconds }] of this.caches.entries()) {
            // If we don't already have a Map for timers for this cache, create it
            if (!this.disconnectTimers.has(cacheName)) {
                this.disconnectTimers.set(cacheName, new Map());
            }
            const userTimers = this.disconnectTimers.get(cacheName)!;

            // Schedule a timer to free the data after expirationSeconds
            const timer = setTimeout(() => {
                cache.free(event.userid);
                userTimers.delete(event.userid);
            }, expirationSeconds * 1000);

            userTimers.set(event.userid, timer);
        }
    }
}
