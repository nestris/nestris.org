import { TetrominoType } from "../tetromino-type";

/**
 * Abstract class for implementations that enerates piece sequence. 
 * Could be 1/7 randomness, NES randomness, set seed, etc.
 */
export abstract class RNG {

    abstract getNextPiece(): TetrominoType;
    abstract copy(): RNG;

}


