/**
 * Puzzle Prefetch System
 * 
 * This module implements a system for prefetching and managing chess puzzles for users.
 * It allows for efficient puzzle retrieval by prefetching puzzles in the background
 * and providing them when requested.
 * 
 * Key components:
 * - PuzzleUserPrefetch: Manages the prefetching process for a single user.
 * - PuzzlePrefetchManager: Orchestrates prefetching and retrieval for multiple users.
 * 
 * The system uses Promises to handle asynchronous operations, ensuring that:
 * 1. Prefetching starts immediately when requested.
 * 2. Retrieval blocks only for the exact duration needed if a puzzle is still being fetched.
 * 3. Prefetched puzzles are immediately available if already fetched.
 * 
 */

import { RatedPuzzle } from "../../shared/puzzles/rated-puzzle";
import { queryUserByUserID } from "../database-old/user-queries";
import { fetchRandomPuzzleWithRating, getRandomPuzzleRatingForPlayerElo } from "../puzzle-generation/select-puzzle";
import { ServerState } from "./server-state";

async function fetchPuzzleForUser(userid: string, elo: number): Promise<RatedPuzzle> {
    const rating = getRandomPuzzleRatingForPlayerElo(elo);
    const puzzle = await fetchRandomPuzzleWithRating(rating, userid);
    return puzzle;
}   

export class PuzzleUserPrefetch {
    private fetchPromise: Promise<RatedPuzzle>;
    private resolvePromise!: (puzzle: RatedPuzzle) => void;

    constructor(
        public readonly userid: string,
        public readonly elo: number,
    ) {
        this.fetchPromise = new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    public async fetch() {
        const puzzle = await fetchPuzzleForUser(this.userid, this.elo);
        this.resolvePromise(puzzle);
    }

    public getPuzzle(): Promise<RatedPuzzle> {
        return this.fetchPromise;
    }
}

export class PuzzlePrefetchManager {
    private readonly prefetches: Map<string, PuzzleUserPrefetch> = new Map();

    constructor(private readonly state: ServerState) {}

    // start prefetching a puzzle for a user
    public prefetchPuzzleForUser(userid: string, elo: number) {
        const prefetch = new PuzzleUserPrefetch(userid, elo);
        this.prefetches.set(userid, prefetch);
        prefetch.fetch().catch(error => {
            console.error(`Error prefetching puzzle for user ${userid}:`, error);
            this.prefetches.delete(userid);
        });
    }

    // get a puzzle for a user, either from prefetch or by fetching a new puzzle
    public async getPuzzleForUser(userid: string): Promise<{
        puzzle: RatedPuzzle,
        elo: number,
    }> {
        if (!this.prefetches.has(userid)) {
            console.log(`No puzzle prefetched for user ${userid}, fetching new puzzle`);

            // first, fetch the user's current puzzle elo from database
            const user = await queryUserByUserID(userid);
            if (!user) throw new Error("User not found");

            // query the database for the user's puzzle elo, as well as the number of puzzles they have attempted
            return {
                puzzle: await fetchPuzzleForUser(userid, user.puzzleElo),
                elo: user.puzzleElo,
            }
        }

        const prefetch = this.prefetches.get(userid)!;
        const puzzle = await prefetch.getPuzzle();
        this.prefetches.delete(userid);
        console.log(`Fetched prefetched puzzle for user ${userid}`);
        return {
            puzzle: puzzle,
            elo: prefetch.elo,
        }
    }
}