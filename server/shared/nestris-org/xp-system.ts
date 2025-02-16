// Strategy for calculating XP gained for some score
export interface XPStrategy {
    (score: number): number;
}

/**
 * Strategy for calculating XP gained for a solo game
 * @param score 
 * @returns 
 */
export const soloXPStrategy: XPStrategy = (score: number) => {
    // https://www.desmos.com/calculator/g5tyne6y40
    return Math.round(Math.pow(score / 25000, 1.6));
};