import { DBPuzzle } from "../../../shared/puzzles/db-puzzle";
import { PuzzleRating } from "../../../shared/puzzles/puzzle-rating";
import { RatedPuzzleResult, RatedPuzzleSubmission, UnsolvedRatedPuzzle } from "../../../shared/puzzles/rated-puzzle";
import { isPrime } from "../../../shared/scripts/math";
import { DBPuzzleSubmitEvent, DBUserObject } from "../../database/db-objects/db-user";
import { Database, DBQuery, WriteDBQuery } from "../../database/db-query";
import { EventConsumer } from "../event-consumer";
import { OnSessionDisconnectEvent } from "../online-user-events";

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
 * Query to update the puzzle stats for a given puzzle in the database.
 * Updates only the guesses, attempts, and solves fields.
 */
class UpdatePuzzleStatsQuery extends WriteDBQuery {
    public override query = `
        UPDATE "public"."rated_puzzles"
        SET 
            "guesses_1" = $1,
            "guesses_2" = $2,
            "guesses_3" = $3,
            "guesses_4" = $4,
            "guesses_5" = $5,
            "num_attempts" = $6,
            "num_solves" = $7
        WHERE "id" = $8
    `;
    public override warningMs = null;

    constructor(puzzle: DBPuzzle) {
        super([
            puzzle.guesses_1,
            puzzle.guesses_2,
            puzzle.guesses_3,
            puzzle.guesses_4,
            puzzle.guesses_5,
            puzzle.num_attempts,
            puzzle.num_solves,
            puzzle.id
        ]);
    }
}


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
    constructor(public readonly rating: PuzzleRating, public readonly batchSize: number) {}

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
        this.puzzles = await Database.query(SamplePuzzlesQuery, this.rating, this.batchSize);
        if (this.puzzles.length !== this.batchSize) {
            throw new Error(`Failed to fetch ${this.batchSize} puzzles for rating ${this.rating}`);
        }

        // Reset the player metadata, and players will recieve new indices and steps for the new batch
        this.players = new Map();

        this.replenishing = false;
        console.log(`Replenished batch for rating ${this.rating} with ${this.batchSize} puzzles in ${Date.now() - startTime}ms`);
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
        userMetadata.index = (userMetadata.index + userMetadata.step) % this.batchSize;

        // Increment the count of puzzles fetched
        userMetadata.count++;

        // If the user has fetched close to BATCH_SIZE puzzles, start replenishing the batch
        if (userMetadata.count > REPLENISH_THRESHOLD * this.batchSize) {
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
                index: Math.floor(Math.random() * this.batchSize),
                step: Math.floor(Math.random() * (this.batchSize - 1)) + 1,
                count: 0
            };
            this.players.set(userid, metadata);
            console.log(`Initialized user ${userid} for rating ${this.rating} with index ${metadata.index} and step ${metadata.step}`);
        }
        return this.players.get(userid)!;
    }
}

/**
 * Calculate the probabilities of each puzzle rating for a player with the given elo.
 * @param elo The player's elo
 * @returns An array of probabilities for each puzzle rating
 */
export function calculateProbabilities(elo: number): number[] {

    if (elo < 200) return [1, 0, 0, 0, 0, 0];

    const minElo = 0;
    const maxElo = 3500;
    const boundedElo = Math.min(Math.max(elo, minElo), maxElo);

    const eloMidpoint = 2000; // At midpoint, normalizedElo = 0.5

    let normalizedElo;
    if (elo < eloMidpoint) normalizedElo = (boundedElo - minElo) / (eloMidpoint - minElo) * 0.5;
    else normalizedElo = 0.5 + (boundedElo - eloMidpoint) / (maxElo - eloMidpoint) * 0.5;

    const oneStar = Math.max(0, 1 - normalizedElo * 3);
    const twoStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.3) * 3); 
    const threeStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.5) * 2.5); 
    let fourStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.8) * 2.4);
    let fiveStar = Math.max(0, normalizedElo * 3 - 1.5);

    // from 3000+, lower chance of 4 star
    if (elo >= 3000) {
        fourStar /= elo / 3000 * 1.2;
    }

    // From 3000+, if puzzle was 5 star, there is an increasing chance of 6 star
    let sixStar = 0;
    if (elo >= 2500) {
        sixStar = Math.min(fiveStar, (elo - 2500) / 2500);
        fiveStar -= sixStar;
    }

    const total = oneStar + twoStar + threeStar + fourStar + fiveStar + sixStar;
    return [oneStar, twoStar, threeStar, fourStar, fiveStar, sixStar].map(p => p / total);
}
 
/**
 * Get a random puzzle rating for a player with the given elo.
 * @param elo The player's elo
 * @returns A random puzzle rating
 */
export function getRandomPuzzleRatingForPlayerElo(elo: number): PuzzleRating {

    const probabilities = calculateProbabilities(elo);
    const randomValue = Math.random();
    let cumulativeProbability = 0;

    for (let i = 0; i < probabilities.length; i++) {
        cumulativeProbability += probabilities[i];
        if (randomValue <= cumulativeProbability) {
        return i + 1 as PuzzleRating;
        }
    }

    // This should never happen, but TypeScript needs a return statement
    return PuzzleRating.THREE_STAR;
}

/**
 * Calculate the elo change for the user for a given puzzle rating.
 * @param userElo The user's current elo
 * @param rating The rating of the puzzle
 * @returns The elo gain and loss for the user
 */
export function calculateEloChangeForPuzzle(userElo: number, rating: PuzzleRating): { eloGain: number, eloLoss: number } {

    if (rating < PuzzleRating.ONE_STAR) throw new Error("Invalid puzzle rating");

    // Boost 6 star puzzles to 8 star for elo calculation
    let ratingNum: number = rating;
    if (rating === PuzzleRating.SIX_STAR) ratingNum = 7;

    const puzzleEloEquivalent = 550 * ratingNum;
    const eloDelta = userElo - puzzleEloEquivalent;

    const ELO_SCALAR = 15;
    const ELO_GROWTH = 1.0003;

    // based on https://www.desmos.com/calculator/47qqusqzhp
    let eloGain = ELO_SCALAR / Math.pow(ELO_GROWTH, eloDelta);
    let eloLoss = ELO_SCALAR / Math.pow(ELO_GROWTH, -eloDelta);

    // Multipler of 2x at elo=0 to 1x at elo=BOOST_THRESHOLD
    const BOOST_THRESHOLD = 500;
    let attemptMultiplier = 1;
    if (userElo < BOOST_THRESHOLD) {
        attemptMultiplier = 2 - userElo / BOOST_THRESHOLD;
    }
    eloGain *= attemptMultiplier;

    // round to nearest integer
    eloGain = Math.round(eloGain);
    eloLoss = Math.round(eloLoss);

    // prevent eloLoss from being higher than userElo, so that userElo doesn't go negative
    eloLoss = Math.min(eloLoss, userElo);

    return { eloGain, eloLoss };
}

interface ActivePuzzleData {
    puzzle: DBPuzzle; // The puzzle being solved
    startElo: number; // The user's starting elo for the puzzle
    eloGain: number; // The elo gain for the user if they solve the puzzle
    eloLoss: number; // The elo loss for the user if they fail to solve the puzzle
}

interface ActivePuzzle {
    sessionID: string; // The session ID of the user solving the puzzle
    data?: ActivePuzzleData; // The data of the active puzzle
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
type RatedPuzzleConfig = {batchSize: number};

/**
 * Consumer for handling distributing random puzzles to users with the help of an in-memory puzzle cache for each rating.
 * 
 * Manages the rated (timed) puzzle each user is currently solving. Manages fetching the puzzle, waiting for
 * the user submission, and updating the user's rating based on the result. On session offline or 
 * submission timeout (1 minute), the puzzle is automatically submitted as incorrect.
 */
export class RatedPuzzleConsumer extends EventConsumer<RatedPuzzleConfig> {

    // Map of puzzle batches for each rating
    private puzzleBatches = new Map<PuzzleRating, PuzzleBatch>();

    // A map of userid to their active puzzle
    private activePuzzles = new Map<string, ActivePuzzle>();

    private puzzleCount: number = 0;

    /**
     * Initialize the puzzle batches for each rating.
     */
    public override async init() {

        // Assert batch size is prime
        if (!isPrime(this.config.batchSize)) {
            throw new Error(`Batch size ${this.config.batchSize} is not prime`);
        }
        
        // Initialize the puzzle batches for each rating
        const batchInitPromises = [];
        for (let rating = PuzzleRating.ONE_STAR; rating <= PuzzleRating.FIVE_STAR; rating++) {
            const batch = new PuzzleBatch(rating, this.config.batchSize);
            batchInitPromises.push(batch.replenish());
            this.puzzleBatches.set(rating, batch);
        }

        // Wait for all batches to initialize
        await Promise.all(batchInitPromises);
        console.log("All puzzle batches initialized");
    }

    /**
     * Fetch a random puzzle of the given rating for the given user id
     * @param userid The user id to fetch the puzzle for
     * @param rating The rating of the puzzle to fetch
     * @returns 
     */
    private fetchRandomPuzzleWithRating(userid: string, rating: PuzzleRating): DBPuzzle {
        const batch = this.puzzleBatches.get(rating);
        if (!batch) throw new Error(`Puzzle batch not found for rating ${rating}`);
        return batch.fetchPuzzle(userid);
    }

    /**
     * Request a rated puzzle for the given user id and session ID. This will determine the rating of the puzzle
     * based on the user's current rating, fetch a random puzzle of that rating, and add it as the user's active puzzle.
     * @param userid The user id to request the puzzle for
     * @param sessionID The session ID of the user requesting the puzzle
     * @returns The unsolved rated puzzle object for the user to solve, or null if the user already has an active puzzle
     */
    public async requestRatedPuzzle(userid: string, sessionID: string): Promise<UnsolvedRatedPuzzle | null> {

        // If the user already has an active puzzle, a new puzzle cannot be requested
        if (this.activePuzzles.has(userid)) return null;

        // Immediately set the user's active puzzle with undefined values to prevent multiple requestRatedPuzzle calls
        this.activePuzzles.set(userid, { sessionID });

        try {
            // Get the user's current rating and use it to randomly determine the next puzzle's rating
            const user = await DBUserObject.get(userid);        
            let puzzleRating = getRandomPuzzleRatingForPlayerElo(user.puzzle_elo);

            // For now, disable 6 star puzzles
            if (puzzleRating === PuzzleRating.SIX_STAR) puzzleRating = PuzzleRating.FIVE_STAR;

            // Fetch a random puzzle of the determined rating
            const puzzle = this.fetchRandomPuzzleWithRating(userid, puzzleRating);

            // Determine the elo change for the user based on the puzzle rating
            const { eloGain, eloLoss } = calculateEloChangeForPuzzle(user.puzzle_elo, puzzleRating);

            // Set the user's active puzzle with the fetched puzzle and elo changes
            this.activePuzzles.set(userid, { 
                sessionID,
                data : { puzzle, startElo: user.puzzle_elo, eloGain, eloLoss }
            });
            console.log(`User ${userid} fetched rated puzzle ${puzzle.id} with rating ${puzzleRating}, eloGain ${eloGain}, eloLoss ${eloLoss}`);

            // Set a 45 second timeout for the user to submit the puzzle, after which it will be automatically submitted
            setTimeout(async () => {
                
                // Ignore if this is not the user's active puzzle anymore
                const activePuzzle = this.activePuzzles.get(userid);
                if (!activePuzzle || !activePuzzle.data || activePuzzle.data.puzzle !== puzzle) return;

                console.log(`User ${userid} timed out on rated puzzle ${puzzle.id}, submitting as incorrect`);
                await this.submitRatedPuzzle(userid, { puzzleID: puzzle.id, seconds: 30 });

            }, 45 * 1000);

            this.puzzleCount++;

            // Return the unsolved rated puzzle
            return { id: puzzle.id, startElo: user.puzzle_elo, eloGain, eloLoss };

        } catch (e) {
            // On any error with fetching the puzzle, remove the user's active puzzle
            this.activePuzzles.delete(userid);
            console.error(`Failed to fetch rated puzzle for user ${userid}: ${e}`);
            throw e;
        }
        
    }

    /**
     * Submit a rated puzzle for the given user id, based on the active puzzle they are currently solving. Update
     * the user's rating based on the result of the puzzle submission, and reset the user's active puzzle.
     * @param userid The user id to submit the puzzle for
     * @param submission The user's submission for the puzzle
     * @returns The full DBPuzzle object of the puzzle that was submitted, which contains the solution
     */
    public async submitRatedPuzzle(userid: string, submission: RatedPuzzleSubmission): Promise<RatedPuzzleResult> {

        // Throw an error if the active puzzle for the puzzle does not exist
        const activePuzzle = this.activePuzzles.get(userid);
        if (!activePuzzle) throw new Error("User does not have an active puzzle");
        if (!activePuzzle.data) throw new Error("User's active puzzle was not loaded");

        // Throw an error if the active puzzle does not correspond to the submission puzzle
        const dbPuzzle = activePuzzle.data.puzzle;
        if (submission.puzzleID !== dbPuzzle.id) {
            throw new Error("Submission puzzle does not match active puzzle");
        }

        // Remove the user's active puzzle immediately before async stuff
        this.activePuzzles.delete(userid);

        // Determine if the user solved the puzzle correctly by checking if both the current and next pieces match
        const isCorrect = (dbPuzzle.current_1 === submission.current && dbPuzzle.next_1 === submission.next);

        // New elo is the user's starting elo plus the elo gain or loss
        const newElo = activePuzzle.data.startElo + (isCorrect ? activePuzzle.data.eloGain : -activePuzzle.data.eloLoss);

        // Calculate the xp gained for the user, which is 1 xp for every 200 elo gained
        const xpGained = isCorrect ? Math.floor(newElo / 200) + 1 : 0;
        
        // Update the in-memory user's rating, but don't wait for database call to finish
        await DBUserObject.alter(userid, new DBPuzzleSubmitEvent({
            users: this.users,
            sessionID: activePuzzle.sessionID,
            seconds: submission.seconds,
            newElo, isCorrect, nonQuestXpGained: xpGained
        }), false);
        console.log(`User ${userid} submitted rated puzzle ${dbPuzzle.id} with ${isCorrect ? "correct" : "incorrect"} solution, new elo ${newElo}, xp gained ${xpGained}`);

        // Start updating puzzle stats based on submission, but don't wait for database call to finish
        this.updatePuzzleStats(dbPuzzle, submission, isCorrect);

        // After some time seconds, decrement the puzzle count. Waiting approximates the time the user looks at the solution
        setTimeout(() => {
            this.puzzleCount--;
        }, 3 * 1000);

        // Return the full DBPuzzle object of the puzzle that was submitted
        return {
            puzzle: dbPuzzle,
            isCorrect,
            newElo
        }
    }


    /**
     * If session with active puzzle disconnects, submit the puzzle as incorrect.
     * @param event The session disconnect event
     */
    protected override async onSessionDisconnect(event: OnSessionDisconnectEvent): Promise<void> {

        // Ignore if the session does not have a loaded active puzzle
        const activePuzzle = this.activePuzzles.get(event.userid);
        if (!activePuzzle || !activePuzzle.data || activePuzzle.sessionID !== event.sessionID) return;

        // Submit the puzzle as incorrect
        console.log(`User ${event.userid} disconnected with active puzzle, submitting as incorrect`);
        await this.submitRatedPuzzle(event.userid, { puzzleID: activePuzzle.data.puzzle.id, seconds: 30 });
        
    }

    // Update the puzzle's stats for the number of guesses, attempts, and solves based on submission
    private async updatePuzzleStats(puzzle: DBPuzzle, submission: RatedPuzzleSubmission, isCorrect: boolean) {

        const updatedPuzzle = { ...puzzle };

        // Update the number of attempts and solves
        updatedPuzzle.num_attempts++;
        if (isCorrect) updatedPuzzle.num_solves++;

        // Update which guess the user made
        if (puzzle.current_1 === submission.current && puzzle.next_1 === submission.next) updatedPuzzle.guesses_1++;
        else if (puzzle.current_2 === submission.current && puzzle.next_2 === submission.next) updatedPuzzle.guesses_2++;
        else if (puzzle.current_3 === submission.current && puzzle.next_3 === submission.next) updatedPuzzle.guesses_3++;
        else if (puzzle.current_4 === submission.current && puzzle.next_4 === submission.next) updatedPuzzle.guesses_4++;
        else if (puzzle.current_5 === submission.current && puzzle.next_5 === submission.next) updatedPuzzle.guesses_5++;

        await Database.query(UpdatePuzzleStatsQuery, updatedPuzzle);
    }

    /**
     * Get the number of active puzzles currently being solved.
     * @returns The number of active puzzles
     */
    public activePuzzleCount(): number {
        return this.puzzleCount;
    }

}