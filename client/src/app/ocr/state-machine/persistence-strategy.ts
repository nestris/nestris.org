export abstract class PersistenceStrategy {

    /**
     * Called every tick to update the state of the persistence strategy.
     * @param preconditionMet Whether the precondition for this event was met this tick
     * @returns Whether the persistence strategy deems that the persistence condition has been met
     */
    abstract meetsPersistenceCondition(preconditionMet: boolean): boolean;
}

/**
 * Simplest persistence strategy that requires the precondition to be met for a single frame.
 */
export class SingleFramePersistenceStrategy extends PersistenceStrategy {

    /**
     * Returns whether the precondition was met this frame.
     * @param preconditionMet Whether the precondition for this event was met this tick
     * @returns Whether the precondition was met this frame
     */
    override meetsPersistenceCondition(preconditionMet: boolean): boolean {
        return preconditionMet;
    }
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

export class TimedPersistenceStrategy extends PersistenceStrategy {

    private startSuccess: number | null = null;

    constructor(
        private readonly requiredMs: number
    ) { super(); }

    /**
     * Checks if the precondition has been met for the required number of consecutive frames.
     * @param preconditionMet Whether the precondition for this event was met this tick
     * @returns Whether the precondition has been met for the required number of consecutive frames
     */
    override meetsPersistenceCondition(preconditionMet: boolean): boolean {

        if (preconditionMet) {
            if (!this.startSuccess) this.startSuccess = Date.now();
            else if (Date.now() - this.startSuccess > this.requiredMs) return true;

        } else this.startSuccess = null;
        
        return false;
    }
}