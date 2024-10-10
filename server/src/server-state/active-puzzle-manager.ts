import { RatedPuzzle } from "../../shared/puzzles/rated-puzzle";
import { SerializedPuzzleSubmission } from "../../shared/puzzles/serialized-puzzle-submission";
import { submitPuzzleAttempt } from "../puzzle-generation/submit-puzzle-attempt";
import { ServerState } from "./server-state";

export class ActivePuzzle {

    private readonly startTime: number = Date.now();

    constructor(
        public readonly puzzle: RatedPuzzle,
        public readonly userElo: number,
        public readonly eloGain: number,
        public readonly eloLoss: number
    ) {}

    // Gets elapsed time in seconds
    public getElapsedTime(): number {
        return (Date.now() - this.startTime) / 1000;
    }
}

export class ActivePuzzleManager {

    constructor(private readonly state: ServerState) {}

    // maps userid to active puzzle
    private activePuzzles: Map<string, ActivePuzzle> = new Map();

    getActivePuzzle(userid: string): ActivePuzzle | undefined {
        return this.activePuzzles.get(userid);
    }

    setActivePuzzle(userid: string, puzzle: RatedPuzzle, userElo: number, eloGain: number, eloLoss: number) {
        this.activePuzzles.set(userid, new ActivePuzzle(puzzle, userElo, eloGain, eloLoss));
        console.log("ACTIVE PUZZLE", this.activePuzzles.get(userid), "FOR USER", userid, "elo", userElo, "eloGain", eloGain, "eloLoss", eloLoss);

        // In 60 seconds, clear the active puzzle if it's the same one
        setTimeout(() => {
            if (puzzle.id === (this.activePuzzles.get(userid)?.puzzle.id)) {
                this.timeoutActivePuzzle(userid);
            }
        }, 60000);
    }

    clearActivePuzzle(userid: string) {
        console.log("CLEARING ACTIVE PUZZLE");
        this.activePuzzles.delete(userid);
    }

    // If the player has an active puzzle, submit it as a timed out attempt
    async timeoutActivePuzzle(userid: string) {

        // If the player has no active puzzle, do nothing
        const currentActivePuzzle = this.activePuzzles.get(userid);
        if (currentActivePuzzle === undefined) {
            console.log("NO ACTIVE PUZZLE TO TIMEOUT");
            return;
        }

        // submit the current active puzzle as a timed out attempt
        const submission: SerializedPuzzleSubmission = { // submission with no placements, so it's a timeout
            userid: userid,
            puzzleID: currentActivePuzzle.puzzle.id,
        };

        try {
            await submitPuzzleAttempt(this.state, submission);
        } catch (error) {
            // If can't submit the previous active puzzle, do not crash but just delete the active puzzle
            console.log("During timeout, error submitting puzzle attempt", error);
        }

        // clear the active puzzle
        this.clearActivePuzzle(userid);

        console.log("TIMED OUT PUZZLE", currentActivePuzzle);
    }
    

}