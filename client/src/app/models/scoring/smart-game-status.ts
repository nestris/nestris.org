import GameStatus, { IGameStatus } from "./game-status";

// A game status that increments its own score/level/lines

const SCORE_RATIO: { [numLines: number]: number } = {
    1: 40,
    2: 100,
    3: 300,
    4: 1200
};

export class SmartGameStatus implements IGameStatus {

    private gameStatus: GameStatus;
    private transitionLines: number;

    constructor(public readonly startLevel: number,
        initialLines: number = 0,
        initialScore: number = 0,
        initialLevel?: number
    ) {
        this.gameStatus = new GameStatus(initialLevel ? initialLevel : startLevel, initialLines, initialScore);

        // calculate transition lines
        if (startLevel <= 9) this.transitionLines = (startLevel + 1) * 10;
        else if (startLevel <= 15) this.transitionLines = 100;
        else if (startLevel <= 19) this.transitionLines = (startLevel - 5) * 10;
        else this.transitionLines = 200;

    }

    public get level(): number {
        return this.gameStatus.level;
    }

    public get lines(): number {
        return this.gameStatus.lines;
    }

    public get score(): number {
        return this.gameStatus.score;
    }
    
    public get status(): GameStatus {
        return this.gameStatus;
    }

    public copy(): SmartGameStatus {
        return new SmartGameStatus(this.startLevel, this.lines, this.score, this.level);
    }

    public onLineClear(numLines: number): void {

        if (numLines === 0) return;
        if (numLines < 1 || numLines > 4) throw new Error("Invalid number of lines: " + numLines);

        const lineTens = Math.floor(this.gameStatus.lines / 10);

        // calculate level and lines
        this.gameStatus.lines += numLines;

        const newLineTens = Math.floor(this.gameStatus.lines / 10);
        if (this.gameStatus.lines >= this.transitionLines && newLineTens > lineTens) this.gameStatus.level++;

        // calculate score
        this.gameStatus.score += SCORE_RATIO[numLines] * (this.gameStatus.level + 1);
    }

    // increment score by the given number of pushdown points
    public onPushdown(pushdown: number) {
        this.gameStatus.score += pushdown;
    }

}