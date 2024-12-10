export enum EvaluationRating {
    ERROR = "Error",
    BRILLIANT = "Brilliant",
    BEST = "Best",
    EXCELLENT = "Excellent",
    GOOD = "Good",
    INACCURACY = "Inaccuracy",
    MISTAKE = "Mistake",
    BLUNDER = "Blunder",
}

export const EVALUATION_TO_COLOR: { [key in EvaluationRating]: string } = {
    [EvaluationRating.ERROR]: 'grey',
    [EvaluationRating.BRILLIANT]: '#B649E9',
    [EvaluationRating.BEST]: '#58D774',
    [EvaluationRating.EXCELLENT]: '#91E469',
    [EvaluationRating.GOOD]: '#C9C9C9',
    [EvaluationRating.INACCURACY]: '#E6DF3E',
    [EvaluationRating.MISTAKE]: '#D79558',
    [EvaluationRating.BLUNDER]: '#D75858',
};


// Given a Stackrabbit evaluation, rescale it so that large differences in large negative evals are reduced
// https://www.desmos.com/calculator/gvfheeg8rc
export function rescaleStackrabbitEval(ev: number): number {
    const C = 10;
    if (ev < 0) return -Math.sqrt(C - ev);
    else return ev * (1 / (2 * Math.sqrt(C))) - Math.sqrt(C);
}

// Assigns a placement score between 0 and 1 based on the difference between the player's eval and the best eval
export function calculatePlacementScore(bestEval: number, playerEval: number) {
    const DIFFICULTY = 1.35;
    
    const rescaledBestEval = rescaleStackrabbitEval(bestEval);
    const rescaledPlayerEval = rescaleStackrabbitEval(playerEval);

    const score = Math.pow(DIFFICULTY, rescaledPlayerEval - rescaledBestEval);
    return Math.max(0, Math.min(1, score));
}

export function overallAccuracyRating(accuracy: number): EvaluationRating {
    if (accuracy >= 95) return EvaluationRating.BRILLIANT;
    if (accuracy >= 90) return EvaluationRating.BEST;
    if (accuracy >= 80) return EvaluationRating.EXCELLENT;
    if (accuracy >= 70) return EvaluationRating.GOOD;
    if (accuracy >= 60) return EvaluationRating.INACCURACY;
    if (accuracy >= 50) return EvaluationRating.MISTAKE;
    return EvaluationRating.BLUNDER;
}