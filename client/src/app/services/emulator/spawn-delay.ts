import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";

// return the number of delay frames after a piece has locked
// it is dependent on the y position of the piece
export function getLockDelay(lastPlacement: MoveableTetromino): number {

    /*
    ARE is 10~18 frames depending on the height at which the piece locked;
    pieces that lock in the bottom two rows are followed by 10 frames of entry delay,
    and each group of 4 rows above that has an entry delay 2 frames longer than the last. 
    */
    const y = lastPlacement.getLowestY();
    const additionalDelay = Math.floor((19 - y + 2) / 4);

    return 10 + additionalDelay * 2; // TODO: make this more accurate

}