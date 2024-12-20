import { TetrominoType } from "../tetromino-type";
import { RNG } from "./rng";

/*
The simplest possible RNG with 1/7 probability for each piece.
*/
export  class RandomRNG extends RNG {
    override getNextPiece(): TetrominoType {
        const rand = Math.random();
        if (rand < 1/7) {
            return TetrominoType.I_TYPE;
        } else if (rand < 2/7) {
            return TetrominoType.J_TYPE;
        } else if (rand < 3/7) {
            return TetrominoType.L_TYPE;
        } else if (rand < 4/7) {
            return TetrominoType.O_TYPE;
        } else if (rand < 5/7) {
            return TetrominoType.S_TYPE;
        } else if (rand < 6/7) {
            return TetrominoType.T_TYPE;
        } else {
            return TetrominoType.Z_TYPE;
        }
    }

    override copy(): RNG {
        return new RandomRNG();
    }
}