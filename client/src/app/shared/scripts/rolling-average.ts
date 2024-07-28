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
}