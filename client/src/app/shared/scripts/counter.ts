/**
 * Counter class that returns true every 'period' calls to next(), and false otherwise.
 * The first call to next() will always return true.
 */
export class Counter {
    private period: number;
    private count: number;
  
    constructor(period: number) {
      if (period <= 0) {
        throw new Error("Period must be a positive integer.");
      }
      this.period = period;
      this.count = 0;
    }
  
    next(): boolean {
      const result = this.count === 0;
      this.count = (this.count + 1) % this.period;
      return result;
    }
  }