import { BehaviorSubject, filter, firstValueFrom, take } from "rxjs";

/**
 * Wait until the source BehaviorSubject emits a value that satisfies the condition.
 * @param source$ The source BehaviorSubject
 * @param condition The condition to satisfy
 */
export async function waitUntilCondition<T>(source$: BehaviorSubject<T>, condition: (val: T) => boolean): Promise<void> {
    await firstValueFrom(
        source$.pipe(
        filter(val => condition(val)),
        take(1),
        )
    );
}

/**
 * Wait until the source BehaviorSubject emits the expected value.
 * @param source$ The source BehaviorSubject
 * @param expectedValue The value to wait for
 */
export async function waitUntilValue<T>(source$: BehaviorSubject<T>, expectedValue: T): Promise<void> {
    await waitUntilCondition(source$, val => val === expectedValue);
}