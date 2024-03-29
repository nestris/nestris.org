/* Abstract class for implementations that enerates piece sequence. 
Could be 1/7 randomness, NES randomness, set seed, etc. */

import { TetrominoType } from "../../../../../network-protocol/tetris/tetromino-type";

export abstract class RNG {

    abstract getNextPiece(): TetrominoType;

}


