export enum RollingAverageStrategy {
    DELTA = "delta",
    ABSOLUTE = "absolute",
}

// Calculate the average of the last N numbers using ring queue impl
export class RollingAverage {
    private values: number[];
    private size: number;
    private end: number;
    private count: number;

    private rollingSum = 0;

    constructor(size: number, private readonly strategy: RollingAverageStrategy = RollingAverageStrategy.ABSOLUTE) {
        this.size = size;
        this.values = new Array(size).fill(0);
        this.end = -1;
        this.count = 0;
    }

    reset(): void {
        this.end = -1;
        this.count = 0;
        this.rollingSum = 0;
        this.values.fill(0);
    }

    push(value: number): void {

        const afterEnd = (this.end + 1) % this.size;
        if (this.strategy === RollingAverageStrategy.DELTA && afterEnd < this.count) {
            this.rollingSum -= this.values[afterEnd];
        }

        this.end = afterEnd;
        this.values[this.end] = value;

        if (this.strategy === RollingAverageStrategy.DELTA) this.rollingSum += value;

        if (this.count < this.size) {
            this.count++;
        }
    }

    get(): number {
        if (this.count === 0) {
            return 0;
        }

        if (this.strategy === RollingAverageStrategy.DELTA) return this.rollingSum / this.count;

        let sum = 0;
        for (let i = 0; i < this.count; i++) {
            sum += this.values[i];
        }

        return sum / this.count;
    }

    getValues(): number[] {
        return this.values.slice(0, this.count);
    }

    isFull(): boolean {
        return this.count === this.size;
    }

    getStatistics(): { mean: number; min: number; max: number; sd: number } {
        const values = this.getValues();
        const count = values.length;
    
        if (count === 0) {
            return { mean: 0, min: 0, max: 0, sd: 0 };
        }
    
        const mean = values.reduce((sum, val) => sum + val, 0) / count;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / count;
        const sd = Math.sqrt(variance);
    
        return { mean, min, max, sd };
    }
}