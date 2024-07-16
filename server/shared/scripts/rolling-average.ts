// Calculate the average of the last N numbers using ring queue impl
export class RollingAverage {
    private values: number[];
    private size: number;
    private end: number;
    private count: number;

    constructor(size: number) {
        this.size = size;
        this.values = new Array(size).fill(0);
        this.end = -1;
        this.count = 0;
    }

    push(value: number): void {
        this.end = (this.end + 1) % this.size;
        this.values[this.end] = value;

        if (this.count < this.size) {
            this.count++;
        }
    }

    get(): number {
        if (this.count === 0) {
            return 0;
        }

        let sum = 0;
        for (let i = 0; i < this.count; i++) {
            sum += this.values[i];
        }

        return sum / this.count;
    }
}