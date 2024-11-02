import { RollingAverage, RollingAverageStrategy } from "../../shared/scripts/rolling-average";

export interface DBCacheMonitorResult {
    numCacheHits: number;
    numCacheMisses: number;
    averageDBQueryTime: number;
    numCacheEntries: number;
}

/**
 * Monitors the size, usage, and cache hit rate of each in-memory cache for the database
 */
export class DBCacheMonitor {

    // All cache monitors by name
    private static cacheMonitors: Map<string, DBCacheMonitor> = new Map();

    /**
     * Get the cache monitor for a specific cache, creating it if it doesn't exist
     * @param cacheName The name of the cache
     * @returns The cache monitor
     */
    private static getCacheMonitor(cacheName: string): DBCacheMonitor {
        if (!DBCacheMonitor.cacheMonitors.has(cacheName)) {
            DBCacheMonitor.cacheMonitors.set(cacheName, new DBCacheMonitor());
        }
        return DBCacheMonitor.cacheMonitors.get(cacheName)!;
    }

    /**
     * Increment the number of cache hits for a specific cache
     * @param cacheName The name of the cache
     */
    public static recordCacheHit(cacheName: string): void {
        DBCacheMonitor.getCacheMonitor(cacheName).recordCacheHit();
    }

    /**
     * Increment the number of cache misses for a specific cache
     * @param cacheName The name of the cache
     * @param time The time it took to execute the query
     */
    public static recordCacheMiss(cacheName: string, time: number): void {
        DBCacheMonitor.getCacheMonitor(cacheName).recordCacheMiss(time);
    }

    /**
     * Set the number of cache entries for a specific cache
     * @param cacheName The name of the cache
     * @param numCacheEntries The number of cache entries
     */
    public static setNumCacheEntries(cacheName: string, numCacheEntries: number): void {
        DBCacheMonitor.getCacheMonitor(cacheName).setNumCacheEntries(numCacheEntries);
    }

    /**
     * Get the cache monitor results for a specific cache
     * @param cacheName The name of the cache
     * @returns The cache monitor results
     */
    public static getCacheMonitorResults(cacheName: string): DBCacheMonitorResult {
        const cacheMonitor = DBCacheMonitor.getCacheMonitor(cacheName);
        return {
            numCacheHits: cacheMonitor.numCacheHits,
            numCacheMisses: cacheMonitor.numCacheMisses,
            averageDBQueryTime: cacheMonitor.averageDBQueryTime.get(),
            numCacheEntries: cacheMonitor.numCacheEntries
        };
    }

    /**
     * Get the cache monitor results for every cache
     */
    public static getAllCacheMonitorResults(): { [cacheName: string]: DBCacheMonitorResult } {
        const results: { [cacheName: string]: DBCacheMonitorResult } = {};
        DBCacheMonitor.cacheMonitors.forEach((cacheMonitor, cacheName) => {
            results[cacheName] = DBCacheMonitor.getCacheMonitorResults(cacheName);
        });
        return results;
    }


    // The number of cache entries
    private numCacheEntries = 0;

    // The number of cache hits and misses
    private numCacheHits = 0;
    private numCacheMisses = 0;

    // Store the last 100 query times for cache misses
    private averageDBQueryTime = new RollingAverage(100, RollingAverageStrategy.ABSOLUTE);

    constructor() {}

    /**
     * Record a cache hit
     */
    public recordCacheHit(): void {
        this.numCacheHits++;
    }

    /**
     * Record a cache miss
     * @param time The time it took to execute the query
     */
    public recordCacheMiss(time: number): void {
        this.numCacheMisses++;
        this.averageDBQueryTime.push(time);
    }

    /**
     * Set the number of cache entries
     */
    public setNumCacheEntries(numCacheEntries: number): void {
        this.numCacheEntries = numCacheEntries;
    }

}