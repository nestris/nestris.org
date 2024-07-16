import { Injectable } from '@angular/core';
import { TetrisBoard } from '../shared/tetris/tetris-board';
import { TetrominoType } from '../shared/tetris/tetromino-type';

@Injectable({
  providedIn: 'root'
})
export class CreatePuzzleRestoreService {

  private board: TetrisBoard = new TetrisBoard();
  private current: TetrominoType = TetrominoType.J_TYPE;
  private next: TetrominoType = TetrominoType.L_TYPE;

  constructor() { }

  save(
    board: TetrisBoard,
    current: TetrominoType,
    next: TetrominoType
  ) {
    this.board = board;
    this.current = current;
    this.next = next;
  }

  restore(): [TetrisBoard, TetrominoType, TetrominoType] {
    return [this.board, this.current, this.next];
  }

}

