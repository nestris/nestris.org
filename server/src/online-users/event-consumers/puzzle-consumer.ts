import { DBPuzzle } from "../../../shared/puzzles/db-puzzle";
import { PuzzleRating } from "../../../shared/puzzles/puzzle-rating";
import { Database, DBQuery } from "../../database/db-query";
import { EventConsumer } from "../event-consumer";

/**
 * Query to fetch a random sample of puzzles of a given rating from the database.
 */
class SamplePuzzlesQuery extends DBQuery<DBPuzzle[]> {
    public override query = `
        SELECT * FROM rated_puzzles WHERE rating = $1 ORDER BY RANDOM() LIMIT $2
    `;
    public override warningMs = null;

    constructor(rating: PuzzleRating, limit: number) {
        super([rating, limit]);
    }

    public override parseResult(resultRows: any[]): DBPuzzle[] {
        return resultRows as DBPuzzle[];
    }
}


/**
 * This represents the number of puzzles to fetch at a time for each rating. This should be a largish prime
 * number which is large enough that the cache isn't constantly being replenished, but small enough that
 * we don't run into memory issues.
 * 
 * For each user, we store their current index pointer i and a random step size S where S < BATCH_SIZE. Each user
 * traverses the batch with formula i_(n+1) = (i_n + S) % BATCH_SIZE. This ensures that each user will traverse
 * the batch in a different order, and that they will not run into any duplicates until they have traversed the
 * entire batch.
 */
const BATCH_SIZE = 7;

// The fraction of the batch that a user can fetch before we start replenishing the batch
const REPLENISH_THRESHOLD = 0.75;

// Metadata for each user in the puzzle batch
interface UserMetadata {
    index: number; // Current index pointer to the puzzle batch
    step: number; // Random step size for traversing the batch
    count: number; // Number of puzzles fetched. If this reaches close to BATCH_SIZE, we should replenish the batch
}

/**
 * A PuzzleBatch represents a batch of puzzles for a given rating. It maintains a mapping of user ids to their
 * metadata, including their current index pointer and step size.
 */
class PuzzleBatch {

    // A batch of puzzles for a given rating with size BATCH_SIZE
    private puzzles!: DBPuzzle[];

    // Map of user ids to their metadata for traversing the batch
    private players!: Map<string, UserMetadata>;

    private replenishing = false;

    // This batch will be in charge of fetching puzzles of the given rating
    constructor(public readonly rating: PuzzleRating) {}

    /**
     * Replenish the puzzle batch with a new set of puzzles from the database. Should be called at the start
     * to get the first batch, and then whenever the batch is close to being exhausted.
     */
    public async replenish() {

        // If we are already replenishing, don't do anything
        if (this.replenishing) return;
        this.replenishing = true;

        const startTime = Date.now();
        console.log(`Replenishing batch for rating ${this.rating}...`);

        // Fetch a new random set of puzzles from the database
        this.puzzles = await Database.query(SamplePuzzlesQuery, this.rating, BATCH_SIZE);
        if (this.puzzles.length !== BATCH_SIZE) {
            throw new Error(`Failed to fetch ${BATCH_SIZE} puzzles for rating ${this.rating}`);
        }

        // Reset the player metadata, and players will recieve new indices and steps for the new batch
        this.players = new Map();

        this.replenishing = false;
        console.log(`Replenished batch for rating ${this.rating} with ${BATCH_SIZE} puzzles in ${Date.now() - startTime}ms`);
    }

    /**
     * Fetch a puzzle for the given user id, based on the user's metadata. Replenishes the batch if the user
     * is close to exhausting the batch.
     * @param userid 
     */
    public fetchPuzzle(userid: string): DBPuzzle {

        // Get the user metadata for the given user id
        const userMetadata = this.getUserMetadata(userid);

        // Fetch the puzzle at the current index
        const puzzle = this.puzzles[userMetadata.index];

        // Update the index for the next fetch. The step size and BATCH_SIZE are coprime, so
        // this will ensure that the user will traverse the batch without repeats.
        userMetadata.index = (userMetadata.index + userMetadata.step) % BATCH_SIZE;

        // Increment the count of puzzles fetched
        userMetadata.count++;

        // If the user has fetched close to BATCH_SIZE puzzles, start replenishing the batch
        if (userMetadata.count > REPLENISH_THRESHOLD * BATCH_SIZE) {
            this.replenish();
        }

        return puzzle;
    }

    /**
     * Gets the user metadata for the given user id. If the user does not exist, creates the metadata
     * with random index and step values. Step must be between 1 and BATCH_SIZE - 1.
     * @param userid The user id to get metadata for
     */
    private getUserMetadata(userid: string): UserMetadata {
        if (!this.players.has(userid)) {
            const metadata: UserMetadata = {
                index: Math.floor(Math.random() * BATCH_SIZE),
                step: Math.floor(Math.random() * (BATCH_SIZE - 1)) + 1,
                count: 0
            };
            this.players.set(userid, metadata);
            console.log(`Initialized user ${userid} for rating ${this.rating} with index ${metadata.index} and step ${metadata.step}`);
        }
        return this.players.get(userid)!;
    }
}

/**
 * Consumer for handling distributing random puzzles to users with the help of an in-memory puzzle cache for each rating.
 */
export class PuzzleConsumer extends EventConsumer {

    private puzzleBatches = new Map<PuzzleRating, PuzzleBatch>();

    public override async init() {
        
        // Initialize the puzzle batches for each rating
        const batchInitPromises = [];
        for (let rating = PuzzleRating.ONE_STAR; rating <= PuzzleRating.FIVE_STAR; rating++) {
            const batch = new PuzzleBatch(rating);
            batchInitPromises.push(batch.replenish());
            this.puzzleBatches.set(rating, batch);
        }

        // Wait for all batches to initialize
        await Promise.all(batchInitPromises);
        console.log("All puzzle batches initialized");

        this.test();
    }

    public fetchPuzzle(userid: string, rating: PuzzleRating): DBPuzzle {
        const batch = this.puzzleBatches.get(rating);
        if (!batch) throw new Error(`Puzzle batch not found for rating ${rating}`);
        return batch.fetchPuzzle(userid);
    }

    private test() {
        const userid = "test";
        const rating = PuzzleRating.ONE_STAR;
        for (let i = 0; i < 10; i++) {
            console.log(this.fetchPuzzle(userid, rating));
        }
    }

}