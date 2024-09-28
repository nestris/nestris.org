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
