import MoveableTetromino from "../shared/tetris/moveable-tetromino";
import { TetrisBoard } from "../shared/tetris/tetris-board";
import { TetrominoType } from "../shared/tetris/tetromino-type";
import { Tetromino } from "../shared/tetris/tetrominos";

test('tetris-board', () => {

    const MTs = [
        new MoveableTetromino(TetrominoType.I_TYPE, 0,  0, 0),
        new MoveableTetromino(TetrominoType.O_TYPE, 0, 5, 6),
        new MoveableTetromino(TetrominoType.T_TYPE, 0, 3, 11),
    ] 

    const board = new TetrisBoard();
    MTs.forEach(mt => mt.blitToBoard(board));

    const cc = board.extractAllConnectedComponents();

    expect(cc.length).toBe(MTs.length);
});