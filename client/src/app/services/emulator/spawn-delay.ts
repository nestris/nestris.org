import MoveableTetromino from "../../models/tetris/moveable-tetromino";

// return the number of delay frames before the piece appears
export function getSpawnDelay(lastPlacement?: MoveableTetromino): number {

    // first spawn has an extra-long delay
    if (!lastPlacement) return 30; // TODO: make this more accurate

    return 10; // TODO: make this more accurate

}