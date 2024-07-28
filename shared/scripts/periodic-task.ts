/*
Class that executes callback every N cycles
*/
export class PeriodicTask {

    private counter = 0;

    constructor(private readonly period: number, private readonly callback: () => void) {}

    execute(): void {
        this.counter++;
        if (this.counter === this.period) {
            this.callback();
            this.counter = 0;
        }
    }

}