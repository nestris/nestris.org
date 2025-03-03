/**
 * TimeDelta class provides a mechanism to measure the time delta between successive calls.
 * It offers high precision timing using performance.now() and mitigates accumulated rounding errors
 * by using a baseline initial time. The class also supports resetting the time reference point with
 * resetDelta().
 */

export class TimeDelta {
    private initialTime: number;
    private lastTime: number;

    private first: boolean = true;
  
    constructor(private readonly startOnFirstGet: boolean = false) {
      this.initialTime = this.getCurrentTime();
      this.lastTime = this.initialTime;
    }
  
    /**
     * Gets the current time using performance.now() for high precision.
     * @returns The current time in milliseconds.
     */
    private getCurrentTime(): number {
      return performance.now();
    }
  
    /**
     * Calculates the time delta in milliseconds since the last call to getDelta(),
     * or since the creation of the instance if this is the first call.
     * The delta is rounded to the nearest integer, and rounding errors are mitigated
     * by using a baseline initial time.
     * @returns The time delta in milliseconds, rounded to the nearest integer.
     */
    public getDelta(): number {

      if (this.startOnFirstGet && this.first) {
        this.resetDelta();
        this.first = false;
      }

      const currentTime = this.getCurrentTime();
      const totalDelta = currentTime - this.initialTime;
      const lastDelta = this.lastTime - this.initialTime;
      const roundedTotalDelta = Math.round(totalDelta);
      const roundedLastDelta = Math.round(lastDelta);
      const delta = roundedTotalDelta - roundedLastDelta;
      this.lastTime = currentTime;
      return delta;
    }
  
    /**
     * Resets the initialTime and lastTime to the current time.
     * The next getDelta() will return the time delta since this call.
     */
    public resetDelta(): void {
      this.initialTime = this.getCurrentTime();
      this.lastTime = this.initialTime;
    }
  }