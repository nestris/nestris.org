import { BehaviorSubject, filter, firstValueFrom, mergeMap, Observable, race, take, throwError } from "rxjs";

/**
 * Wait until the source BehaviorSubject emits a value that satisfies the condition.
 * @param source$ The source BehaviorSubject
 * @param condition The condition to satisfy
 * @param timeout$ An optional observable that will cancel the wait if it emits a value
 * @param error The error to throw if the timeout$ observable emits
 * @returns A promise that resolves when the condition is met or rejects if the timeout$ observable emits
 */
export async function waitUntilCondition<T>(
    source$: BehaviorSubject<T>,
    condition: (val: T) => boolean,
    timeout$?: Observable<unknown>,   // <-- optional
    error = new Error('Condition was not met before timeout.')
  ): Promise<void> {
    
    // The main observable that completes when the condition is met
    const conditionMet$ = source$.pipe(
      filter(val => condition(val)),
      take(1),
    );
  
    // If no timeout$ is passed in, just await the condition
    if (!timeout$) {
      await firstValueFrom(conditionMet$);
      return;
    }
  
    // Otherwise, race the conditionMet$ against the timeout$
    await firstValueFrom(
      race(
        conditionMet$,
        timeout$.pipe(
          take(1),
          mergeMap(() => throwError(() => error))
        )
      )
    );
  }

/**
 * Wait until the source BehaviorSubject emits the expected value.
 * @param source$ The source BehaviorSubject
 * @param expectedValue The value to wait for
 * @param timeout$ An optional observable that will cancel the wait if it emits a value
 * @param error The error to throw if the timeout$ observable emits
 * @returns A promise that resolves when the expected value is emitted or rejects if the timeout$ observable emits
 */
export async function waitUntilValue<T>(
    source$: BehaviorSubject<T>,
    expectedValue: T,
    timeout$?: Observable<unknown>,
    error = new Error('Value was not emitted before timeout.')
): Promise<void> {
    await waitUntilCondition(source$, val => val === expectedValue, timeout$, error);
}

/**
 * Sleep for the given time, or until the timeout$ observable emits.
 * @param time The time to wait in milliseconds
 * @param timeout$ An optional observable that will cancel the sleep if it emits a value
 * @param error The error to throw if the timeout$ observable emits
 * @returns A promise that resolves after the specified time or rejects if the timeout$ observable emits
 */
export function sleepWithTimeout(
    time: number,
    timeout$: Observable<unknown>,
    error = new Error('Timeout occurred before sleep finished.')
) {
    // Create a Promise that resolves after the specified time
    const sleepPromise = new Promise<void>((resolve) => setTimeout(resolve, time));
  
    // If no timeout$ is passed, just return the sleep promise
    if (!timeout$) {
      return sleepPromise;
    }
  
    // Otherwise, race the sleep promise against the timeout$
    return new Promise<void>((resolve, reject) => {
      // Use race to handle both the sleep and timeout$
      timeout$.pipe(
        take(1),
        mergeMap(() => throwError(() => error))
      ).subscribe({
        next: () => reject(error),
        error: reject,
        complete: () => sleepPromise.then(resolve).catch(reject),
      });
      
      // Also resolve the sleepPromise when the sleep time is finished
      sleepPromise.then(resolve).catch(reject);
    });
  }