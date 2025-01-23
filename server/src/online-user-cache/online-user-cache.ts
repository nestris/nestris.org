/**
 * Handles caching expensive queries related to users that are only fetched when the user is online. So, when a user becomes
 * online and there is no cached data for the user, the expensive queries to the database are made and cached and updated
 * while the user is online, but when the user goes offline and an expiration time is reached, the cached data is removed
 * to free up memory.
 * 
 * @template T The type of data to cache for each user
 * @template Event The type of event to update the cache for a user
 */
export abstract class OnlineUserCache<T = any, Event = any> {

    // The map of cached data for users, indexed by their userid
    private readonly cache = new Map<string, T>();

    // The map of in-progress fetches (to prevent duplicate queries)
    private readonly inProgress = new Map<string, Promise<T>>();

    /**
     * Makes the expensive query to the database to fetch the data for the user
     * @param userid The userid of the user to fetch data for
     * @returns A promise that resolves to the data for the user
     */
    protected abstract query(userid: string): Promise<T>;
    

    /**
     * Updates the cache for the user with the given event. Optionally implemented by subclasses.
     * @param userid The userid of the user to update the cache for
     * @param event The event to update the cache with
     * @returns A promise that resolves to the updated data for the user
     */
    protected onEvent(userid: string, previous: T, event: Event): T {
        return previous;
    }

    /**
     * Updates the cache for the user with the given event.
     * @param userid The userid of the user to update the cache for
     * @param event The event to update the cache with
     */
    public update(userid: string, event: Event) {
        if (!this.cache.has(userid)) {
            throw new Error(`No cache found for user ${userid} - is the user offline?`);
        }

        const previous = this.cache.get(userid)!;
        const updated = this.onEvent(userid, previous, event);

        this.cache.set(userid, updated);

        console.log(`Updated ${this.constructor.name} cache for user ${userid}`);
    }


    /**
     * Fetches the data for the user, either from the cache or by making the expensive query to the database
     * If called multiple times in rapid succession for the same user, only one query will be made.
     * @param userid The userid of the user to fetch data for
     * @returns A promise that resolves to the data for the user
     */
    public async fetch(userid: string): Promise<T> {

        // 1) If data is already cached, return it immediately
        if (this.cache.has(userid)) {
            console.log(`Fetched ${this.constructor.name} cache for user ${userid} from cache`);
            return this.cache.get(userid)!;
        }

        // 2) If there's already an in-progress query, return that promise
        if (this.inProgress.has(userid)) {
            console.log(`Fetched ${this.constructor.name} cache for user ${userid} from in-progress`);
            return this.inProgress.get(userid)!;
        }

        // 3) Otherwise, start a new fetch, store the promise in the inProgress map
        const promise = this.query(userid)
            .then((result) => {
                // Once the query resolves, move the data to cache
                this.cache.set(userid, result);
                // Remove the promise from the inProgress map
                this.inProgress.delete(userid);
                return result;
            })
            .catch((error) => {
                // In case of error, clean up inProgress so subsequent fetch() calls can try again
                this.inProgress.delete(userid);
                throw error;
            });

        this.inProgress.set(userid, promise);

        console.log(`Fetched ${this.constructor.name} cache for user ${userid} from query`);

        // Return the promise so that other calls to fetch(userid) await the same result
        return promise;
    }

    /**
     * Frees the data for the user, removing it from the cache
     * @param userid The userid of the user to free data for
     */
    public free(userid: string) {
        // Remove from both cache and inProgress (if you also want to cancel ongoing fetches)
        this.cache.delete(userid);
        this.inProgress.delete(userid);

        console.log(`Freed ${this.constructor.name} cache for user ${userid}`);
    }
}
