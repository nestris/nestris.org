import { DBCacheMonitor } from "./db-cache-monitor";

/**
 * A DBView manages the caching of readonly queries to the database. It supports events that, presumably when the database
 * is externally modified, will update the in-memory object. This allows for fast lookup for the DBView.
 * 
 * 
 * @param name The name of the object, used for logging and debugging
 * @param maxCacheSize The maximum number of views to cache in-memory. If the number of views exceeds this, the least recently used view will be removed.
 * @template View The schema of the in-memory view
 * @template Event An enum of events that can be emitted to alter the object
 */
export function DBView<View, Event>(name: string, maxCacheSize: number = 1000) {

    // Ensure maxCacheSize is valid
    if (maxCacheSize < 0) throw new Error("maxCacheSize must be nonnegative");

    abstract class DBView {

        // A map of all views, indexed by their ID. It is ordered by the order of creation.
        private static dbViews = new Map<string, DBView>();

        // The maximum number of objects to cache in-memory. If the number of objects exceeds this, the least recently used object will be removed.
        private static cacheSize = 0;

        /**
         * Evicts the oldest object from the cache if the cache size exceeds the maximum cache size.
         */
        private static evictOldestIfNeeded() {

            if (DBView.cacheSize >= maxCacheSize && DBView.dbViews.size > 0) {

                // Get the id of the oldest object
                const oldestID = DBView.dbViews.keys().next().value!;

                // Delete the object from the map to free up memory
                DBView.dbViews.delete(oldestID);
                DBView.cacheSize--;
                DBCacheMonitor.setNumCacheEntries(name, DBView.cacheSize);

                console.log(`Evicted ${name} view with ID ${oldestID} from cache to free up memory`);
            }
        }
        

        /**
         * Alters a specific view given id. If the view is not found, then nothing needs to be updated, as future
         * calls to get() will fetch the updated view from the database anyways.
         * @param id The ID of the object to alter
         * @param event The event to alter the object with
         */
        static alter(id: string, event: Event) {

            // Check if the view is in-memory
            if (!DBView.dbViews.has(id)) {
                console.warn(`Attempted to alter ${name} view with ID ${id} that is not in-memory, skipping`);
                return;
            }

            // Alter the in-memory view
            DBView.dbViews.get(id)!.alterView(event);
        }

        /**
         * Gets the in-memory view for a given id. However, if the view is not in-memory, it will fetch the view from the database, then
         * cache it in-memory. Blocks until the view is fetched.
         * 
         * This will be fast if the view is already in-memory, but slow if the view is not in-memory.
         * @param id The ID of the view to get
         * @returns The in-memory view, whether it was cached, and the time it took to fetch the object
         * @throws DBError
         */
        static async get<T extends DBView>(this: new (id: string) => T, id: string): Promise<{
            view: View,
            cached: boolean,
            ms: number
        }> {

            const start = Date.now();

            // Try to fetch the object from the map, if it exists
            const existingDBView = DBView.dbViews.get(id);

            // If the object is in-memory, return the in-memory object
            if (existingDBView) {

                // Record the cache hit
                DBCacheMonitor.recordCacheHit(name);

                console.log(`Got ${name} view with ID ${id} from cache`);
                return {
                    view: existingDBView.get(),
                    cached: true,
                    ms: Date.now() - start
                }
            }

            // We need to fetch the view from the database
            const dbView = new this(id);
            await dbView.sync();

            // Store the view in the map so that future calls to get() will be fast
            DBView.dbViews.set(id, dbView);
            DBView.cacheSize++;
            DBCacheMonitor.setNumCacheEntries(name, DBView.cacheSize);

            // Evict the oldest view if the cache size exceeds the maximum cache size
            DBView.evictOldestIfNeeded();

            // Record the cache miss
            const ms = Date.now() - start;
            DBCacheMonitor.recordCacheMiss(name, ms);

            // Return the in-memory view
            console.log(`Got ${name} view with ID ${id} from database`);
            return {
                view: dbView.get(),
                cached: false,
                ms: ms
            }
        }


        /**
         * "Forget" the object by removing it from the map, and thus removing it from in-memory. The object will still exist in the database. This
         * is useful if the object is no longer needed, and we want to free up memory.
         * @param id 
         */
        static forget(id: string) {
            if (DBView.dbViews.delete(id)) {
                DBView.cacheSize--;
                DBCacheMonitor.setNumCacheEntries(name, DBView.cacheSize);
            }

            console.log(`Forgot ${name} view with ID ${id}`);
        }

        /**
         * Removes all in-memory objects from the cache. This will not modify or delete the objects in the database. Subsequent calls to get() will
         * fetch the object from the database.
         */
        static clearCache() {
            DBView.dbViews.clear();
            DBView.cacheSize = 0;
            DBCacheMonitor.setNumCacheEntries(name, DBView.cacheSize);

            console.log(`Cleared ${name} view cache`);
        }


        constructor(public readonly id: string) {}

        // sync() should be called immediately after construction to initialize the object
        protected view!: View;


        /**
         * Fetches the object from the database and stores it in memory. This method should be called at initialization, and if
         * synchronization is desired.
         */
        public async sync() {
            this.view = await this.fetchViewFromDB();
        }

        /**
         * Gets the in-memory object without fetching from the database.
         * @returns The in-memory object
         */
        public get(): View {
            return this.view;
        }

        /**
         * Fetches the view from the database
         * @returns The view fetched from the database
         * @throws DBError, will throw an DBObjectNotFoundError if the object does not exist in the database
         */
        protected abstract fetchViewFromDB(): Promise<View>;

        // Given an event, alters the in-memory view.
        public abstract alterView(event: Event): void;
    }

    return DBView;
}
