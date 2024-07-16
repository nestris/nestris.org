/*
Stores the current level, lines, and score.
*/

export interface IGameStatus {
    level: number;
    lines: number;
    score: number;
}

export default class GameStatus implements IGameStatus {
    constructor(
        public level: number = 0,
        public lines: number = 0,
        public score: number = 0
    ) {}

    copy(): GameStatus {
        return new GameStatus(this.level, this.lines, this.score);
    }

}