import { TetrominoType } from "../tetris/tetromino-type";

export class DroughtCounter {

    private droughtCount: number = 0;

    constructor() {

    }

    reset() {
        this.droughtCount = 0;
    }

    onPiece(piece: TetrominoType) {
        if (piece == TetrominoType.I_TYPE) {
            this.droughtCount = 0;
        } else {
            this.droughtCount++;
        }
    }

    // returns the drought count if it is 14 or more, otherwise returns null
    getDroughtCount(): number | null {
        if (this.droughtCount >= 14) return this.droughtCount;
        return null;
    }

    copy(): DroughtCounter {
        const copy = new DroughtCounter();
        copy.droughtCount = this.droughtCount;
        return copy;
    }

}