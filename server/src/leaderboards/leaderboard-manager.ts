import { T200LeaderboardData, T200LeaderboardRow, T200LeaderboardType } from "../../shared/models/leaderboard";
import { OnlineUserManager } from "../online-users/online-user-manager";
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

    // map from T200LeaderboardType to t200 leaderboard
    private static readonly t200Leaderboards: Map<T200LeaderboardType, T200Leaderboard> = new Map();

    private static initialized = false;

    /**
     * Initialize all leaderboards and trigger periodic update of T200 leaderboards
     */
    public static async init(users: OnlineUserManager) {

        // Initialize full leaderboards
        for (const fullLeaderboard of LeaderboardManager.fullLeaderboards.values()) {
            await fullLeaderboard.init();
            console.log(`Initialized full leaderboard: ${fullLeaderboard.constructor.name}`);
        }

        // Initialize and update t200 leaderboards
        for (const t200Leaderboard of LeaderboardManager.t200Leaderboards.values()) {
            t200Leaderboard.init(users)
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
    public static async registerT200Leaderboard(t200LeaderboardClass: new () => T200Leaderboard) {

        // Initialize the leaderboard
        const t200Leaderboard = new t200LeaderboardClass();

        // Must be registered before initialization
        if (LeaderboardManager.initialized) {
            throw new Error("LeaderboardManager already initialized");
        }

        // Assert leaderboard is not already registered
        if (LeaderboardManager.t200Leaderboards.has(t200Leaderboard.type)) {
            throw new Error(`T200 leaderboard ${t200Leaderboard.type} is already registered`);
        }
        
        // Register leaderboard
        LeaderboardManager.t200Leaderboards.set(t200Leaderboard.type, t200Leaderboard);
    }

    /**
     * Get the data for a t200 leaderboard by type
     * @param type The type of the t200 leaderboard to get
     */
    public static getT200Leaderboard(type: T200LeaderboardType): T200LeaderboardData {

        if (!LeaderboardManager.initialized) {
            throw new Error("LeaderboardManager not initialized");
        }

        const t200Leaderboard = LeaderboardManager.t200Leaderboards.get(type);
        if (!t200Leaderboard) {
            throw new Error(`T200 leaderboard ${type} is not registered`);
        }
        return t200Leaderboard.get();
    }

}
