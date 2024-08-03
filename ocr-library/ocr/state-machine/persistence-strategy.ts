export abstract class PersistenceStrategy {

    /**
     * Called every tick to update the state of the persistence strategy.
     * @param preconditionMet Whether the precondition for this event was met this tick
     * @returns Whether the persistence strategy deems that the persistence condition has been met
     */
    abstract meetsPersistenceCondition(preconditionMet: boolean): boolean;
}

/**
 * A persistence strategy that requires a certain number of consecutive frames to meet the persistence condition.
 */
export class ConsecutivePersistenceStrategy extends PersistenceStrategy {

    private consecutiveCount: number = 0;

    constructor(
        private readonly requiredConsecutive: number
    ) { super(); }

    /**
     * Checks if the precondition has been met for the required number of consecutive frames.
     * @param preconditionMet Whether the precondition for this event was met this tick
     * @returns Whether the precondition has been met for the required number of consecutive frames
     */
    override meetsPersistenceCondition(preconditionMet: boolean): boolean {

        if (preconditionMet) this.consecutiveCount++;
        else this.consecutiveCount = 0;

        return this.consecutiveCount >= this.requiredConsecutive;
    }
}