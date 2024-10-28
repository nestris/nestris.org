import { T200LeaderboardRow } from "../../shared/models/leaderboard";
import { FullLeaderboard } from "./full-leaderboard";
import { T200Leaderboard } from "./t200-leaderboard";

/**
 * The leaderboard manager manages the construction and initialization of leaderboards, populating them in-memory
 * with expensive SQL calls that should happen once at server startup. It also provides an interface for fetching information
 * on specific leaderboards.
 */
export class LeaderboardManager {

    // map from full leaderboard name to full leaderboard
    private static readonly fullLeaderboards: Map<string, FullLeaderboard> = new Map();

    // map from t200 leaderboard name to t200 leaderboard
    private static readonly t200Leaderboards: Map<string, T200Leaderboard<T200LeaderboardRow>> = new Map();

    private static initialized = false;

    /**
     * Initialize all leaderboards and trigger periodic update of T200 leaderboards
     */
    public static async init() {

        // Initialize full leaderboards
        for (const fullLeaderboard of LeaderboardManager.fullLeaderboards.values()) {
            await fullLeaderboard.init();
            console.log(`Initialized full leaderboard: ${fullLeaderboard.constructor.name}`);
        }

        // Initialize t200 leaderboards
        for (const t200Leaderboard of LeaderboardManager.t200Leaderboards.values()) {
            await t200Leaderboard.updateLeaderboard();
            console.log(`Initialized t200 leaderboard: ${t200Leaderboard.constructor.name}`);
        }

        // Periodically update t200 leaderboards
        setInterval(async () => {
            const start = Date.now();
            for (const t200Leaderboard of LeaderboardManager.t200Leaderboards.values()) {
                await t200Leaderboard.updateLeaderboard();
            }
            console.log(`Updated all t200 leaderboards in ${Date.now() - start}ms`);
        }, 1000 * 20); // 20 seconds

        LeaderboardManager.initialized = true;
    }

    /**
     * Register and initialize a full leaderboard
     * @param fullLeaderboardClass The class of the full leaderboard to register
     */
    public static async registerFullLeaderboard(fullLeaderboardClass: new () => FullLeaderboard) {

        // Must be registered before initialization
        if (LeaderboardManager.initialized) {
            throw new Error("LeaderboardManager already initialized");
        }

        // Assert leaderboard is not already registered
        if (LeaderboardManager.fullLeaderboards.has(fullLeaderboardClass.name)) {
            throw new Error(`Full leaderboard ${fullLeaderboardClass.name} is already registered`);
        }

        // Initialize the leaderboard
        const fullLeaderboard = new fullLeaderboardClass();

        // Register leaderboard
        LeaderboardManager.fullLeaderboards.set(fullLeaderboardClass.name, fullLeaderboard);
    }

    /**
     * Get a full leaderboard by class
     * @param fullLeaderboardClass The class of the full leaderboard to get
     */
    public static getFullLeaderboard(fullLeaderboardClass: new () => FullLeaderboard): FullLeaderboard {

        if (!LeaderboardManager.initialized) {
            throw new Error("LeaderboardManager not initialized");
        }

        const fullLeaderboard = LeaderboardManager.fullLeaderboards.get(fullLeaderboardClass.name);
        if (!fullLeaderboard) {
            throw new Error(`Full leaderboard ${fullLeaderboardClass.name} is not registered`);
        }
        return fullLeaderboard;
    }

    /**
     * Register and initialize a t200 leaderboard
     * @param t200LeaderboardClass The class of the t200 leaderboard to register
     */
    public static async registerT200Leaderboard(t200LeaderboardClass: new () => T200Leaderboard<T200LeaderboardRow>) {

        // Must be registered before initialization
        if (LeaderboardManager.initialized) {
            throw new Error("LeaderboardManager already initialized");
        }

        // Assert leaderboard is not already registered
        if (LeaderboardManager.t200Leaderboards.has(t200LeaderboardClass.name)) {
            throw new Error(`T200 leaderboard ${t200LeaderboardClass.name} is already registered`);
        }

        // Initialize the leaderboard
        const t200Leaderboard = new t200LeaderboardClass();

        // Register leaderboard
        LeaderboardManager.t200Leaderboards.set(t200LeaderboardClass.name, t200Leaderboard);
    }

    /**
     * Get a t200 leaderboard by class
     * @param t200LeaderboardClass The class of the t200
     */
    public static getT200Leaderboard(t200LeaderboardClass: new () => T200Leaderboard<T200LeaderboardRow>): T200Leaderboard<T200LeaderboardRow> {

        if (!LeaderboardManager.initialized) {
            throw new Error("LeaderboardManager not initialized");
        }

        const t200Leaderboard = LeaderboardManager.t200Leaderboards.get(t200LeaderboardClass.name);
        if (!t200Leaderboard) {
            throw new Error(`T200 leaderboard ${t200LeaderboardClass.name} is not registered`);
        }
        return t200Leaderboard;
    }

}
