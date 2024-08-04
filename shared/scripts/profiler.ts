export interface ProfilerResults {
    numExecutions: number;
    median: number;
    average: number;
    worst: number;
    best: number;
}

/**
 * Handles measuring the median, average, worst and best time it took to execute some task. 
 */
export class Profiler {

    // Stores all the durations in ms that were measured
    private durations: number[] = [];

    private currentStartTime?: number;

    /**
     * Starts measuring the time it takes to execute some task.
     */
    startFunction() {

        if (this.currentStartTime) {
            throw new Error('Profiler is already running');
        }

        this.currentStartTime = performance.now();
    }

    /**
     * Stops measuring the time it takes to execute some task.
     */
    stopFunction() {

        if (!this.currentStartTime) {
            throw new Error('Profiler is not running');
        }

        const duration = performance.now() - this.currentStartTime;
        this.durations.push(duration);
        this.currentStartTime = undefined;
    }

    /**
     * Gets the median, average, worst and best time it took to execute some task.
     * @returns The median, average, worst and best time it took to execute some task
     */
    getResults(): ProfilerResults {

        if (this.currentStartTime) {
            throw new Error('Profiler is still running');
        }

        this.durations.sort((a, b) => a - b);
        const median = this.durations[Math.floor(this.durations.length / 2)];
        const average = this.durations.reduce((a, b) => a + b, 0) / this.durations.length;
        const worst = this.durations[this.durations.length - 1];
        const best = this.durations[0];
        

        return { numExecutions: this.durations.length, median, average, worst, best };
    }
}