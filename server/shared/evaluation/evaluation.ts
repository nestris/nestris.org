export enum EvaluationRating {
    ERROR = "ERROR",
    BRILLIANT = "BRILLIANT",
    BEST = "BEST",
    GOOD = "GOOD",
    MEDIOCRE = "MEDIOCRE",
    INACCURACY = "INACCURACY",
    MISTAKE = "MISTAKE",
    BLUNDER = "BLUNDER",
}

export const EVALUATION_TO_COLOR: { [key in EvaluationRating]: string } = {
    [EvaluationRating.ERROR]: 'grey',
    [EvaluationRating.BRILLIANT]: '#B658D7',
    [EvaluationRating.BEST]: '#58D774',
    [EvaluationRating.GOOD]: '#90D758',
    [EvaluationRating.MEDIOCRE]: '#5892D7',
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
    const DIFFICULTY = 1.25;
    
    const rescaledBestEval = rescaleStackrabbitEval(bestEval);
    const rescaledPlayerEval = rescaleStackrabbitEval(playerEval);

    const score = Math.pow(DIFFICULTY, rescaledPlayerEval - rescaledBestEval);
    return Math.max(0, Math.min(1, score));
}