import { RollingAverage, RollingAverageStrategy } from "../scripts/rolling-average";
import { SmartGameStatus } from "./smart-game-status";

export interface StatusSnapshot {
    level: number;
    lines: number;
    score: number;
    tetrisRate: number;
    placement: number;
}

/**
 * A class that captures snapshots of the game status at each line clear. Instead of storing this as an array
 * of snapshots, it stores the snapshots as a 2D array of numbers, where each row is a snapshot and each column
 * is a property of the snapshot, to save space.
 */
export class StatusHistory {
    private snapshots: number[][] = [];

    /**
     * Add a snapshot to the history
     * @param snapshot The snapshot to add
     */
    public addSnapshot(snapshot: StatusSnapshot) {

        // Round the tetris rate to 2 decimal places
        const roundedTetrisRate = Math.round(snapshot.tetrisRate * 100) / 100;

        // Add the snapshot to the history, with each property as a column
        this.snapshots.push([snapshot.level, snapshot.lines, snapshot.score, roundedTetrisRate, snapshot.placement]);
    }

    /**
     * Gets the number of snapshots in the history
     * @returns The number of snapshots
     */
    public length(): number {
        return this.snapshots.length;
    }

    /**
     * Get a snapshot at a given index
     * @param index The index of the snapshot
     * @returns The snapshot
     */
    public getSnapshot(index: number): StatusSnapshot {

        // Check if the index is out of bounds
        if (index < 0 || index >= this.snapshots.length) {
            throw new Error("Snapshot out of bounds: " + index);
        }

        // Map the columns of the snapshot to the properties of the snapshot
        return {
            level: this.snapshots[index][0],
            lines: this.snapshots[index][1],
            score: this.snapshots[index][2],
            tetrisRate: this.snapshots[index][3],
            placement: this.snapshots[index][4]
        }
    }

    /**
     * Get a snapshot closest to a given number of lines cleared
     * @param lines The number of lines cleared
     * @returns The snapshot
     */
    public getSnapshotAtLines(lines: number): StatusSnapshot | null {

        if (this.snapshots.length === 0) return null;
        
        // Find the snapshot with the number of lines closest to given number of lines, but not exceeding it
        let closestIndex = 0;
        for (let i = 0; i < this.snapshots.length; i++) {
            if (this.snapshots[i][1] <= lines) {
                closestIndex = i;
            }
        }

        // Get the snapshot at the closest index
        return this.getSnapshot(closestIndex);
    }


}

/**
 * Specialized game status that captures snapshots of the game status at each line clear, keeping track
 * of the number of lines cleared and tetrises cleared to determine the tetris rate.
 */
export class MemoryGameStatus extends SmartGameStatus {
    private history: StatusHistory = new StatusHistory();

    private linesCleared = 0;
    private numTetrises = 0;

    private rollingTetrisRate = new RollingAverage(14, RollingAverageStrategy.DELTA);

    private placementCount: number = 0;

    constructor(private readonly storeHistory: boolean, startLevel: number, initialLines: number = 0, initialScore: number = 0, initialLevel?: number) {
        super(startLevel, initialLines, initialScore, initialLevel);

        if (this.storeHistory) this.history.addSnapshot({
            level: this.level,
            lines: this.lines,
            score: this.score,
            tetrisRate: 0,
            placement: this.placementCount
        });
    }

    public override onLineClear(numLines: number): void {

        // If no lines were cleared, do nothing
        if (numLines === 0) return;

        // Update the game status with the number of lines cleared
        super.onLineClear(numLines);

        // Update the number of lines cleared and tetrises
        this.linesCleared += numLines;
        if (numLines === 4) this.numTetrises++;

        // Update the rolling tetris rate, with 1 for tetrises and 0 for other line clears
        for (let i = 0; i < numLines; i++) {
            this.rollingTetrisRate.push(numLines === 4 ? 1 : 0);
        }

        // Capture a snapshot of the game status
        if (this.storeHistory) this.history.addSnapshot({
            level: this.level,
            lines: this.lines,
            score: this.score,
            tetrisRate: this.getRollingTetrisRate(),
            placement: this.placementCount
        });   
    }

    public onPlacement(): void {
        this.placementCount++;
    }

    /**
     * Get the number of placements in the game currently
     * @returns The number of placements
     */
    public getTotalPlacementCount(): number {
        return this.placementCount;
    }

    /**
     * Get the number of lines cleared in the game currently
     * @returns The number of lines cleared
     */
    public getLinesCleared(): number {
        return this.linesCleared;
    }

    /**
     * Get the number of tetrises cleared in the game currently
     * @returns The number of tetrises
     */
    public getNumTetrises(): number {
        return this.numTetrises;
    }

    /**
     * Get the rate of tetrises cleared out of all lines cleared in the game currently
     * @returns The tetris rate
     */
    public getTetrisRate(): number {
        if (this.linesCleared === 0) return 0;
        return (this.numTetrises * 4) / this.linesCleared;
    }

    /**
     * Get the rolling average of the tetris rate
     */
    public getRollingTetrisRate(): number {
        return this.rollingTetrisRate.get();
    }

    /**
     * Get the snapshots of the game status
     * @returns The snapshots
     */
    public getHistory(): StatusHistory {
        return this.history;
    }
}