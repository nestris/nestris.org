import { Express } from 'express';

class QueryCacheEntry {

    private lastFetchTime = Date.now();
    private cachedData: any;

    constructor(
        public readonly fetchCallback: () => Promise<any>,
        public readonly cacheSeconds: number,
    ) {}

    // Fetch the data from the fetchCallback if not already cached, or if the cache has expired.
    public async fetch() {
        let useCache = true;

        const now = Date.now();
        if (!this.cachedData || now - this.lastFetchTime > this.cacheSeconds * 1000) {
            this.cachedData = await this.fetchCallback();
            this.lastFetchTime = now;
            useCache = false;
        }

        // Add a flag useCache to the data to indicate whether the data was fetched from cache
        const responseMs = Date.now() - now;
        return { ...this.cachedData, useCache, responseMs };
    }

}

export class QueryCache {

    // Map from query string to QueryCacheEntry
    private cache = new Map<string, QueryCacheEntry>();

    // Create an express route that fetches the query result from cache if within cacheSeconds, or fetches it from the fetchCallback if not.
    // If the fetchCallback throws an error, propagate error as 500 response.
    public addQuery(app: Express, query: string, fetchCallback: () => Promise<any>, cacheSeconds: number) {

        // Register the query in the cache
        this.cache.set(query, new QueryCacheEntry(fetchCallback, cacheSeconds));

        // Create the express route to fetch the query result
        app.get(query, async (req, res) => {
            try {
                const data = await this.cache.get(query)!.fetch();
                res.send(data);
            } catch (err) {
                console.error(err);
                res.status(500).send(`Error fetching data from cache: ${err}`);
            }
        });
    }

}