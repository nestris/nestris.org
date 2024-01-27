import { Injectable } from '@angular/core';
import { PuzzleDefinition } from '../models/puzzles/puzzle';
import { ColorType, TetrisBoard } from '../models/tetris/tetris-board';
import { TetrominoType, getRandomTetrominoType } from '../models/tetris/tetromino-type';
import MoveableTetromino from '../models/tetris/moveable-tetromino';

@Injectable({
  providedIn: 'root'
})
export class FetchPuzzleService {

  constructor() { }

  private generateTestPuzzle(): PuzzleDefinition {

    const board = new TetrisBoard();
    
    // randomize bottom rows
    for (let y = 16; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        let color: ColorType;
        const num = Math.random();
        if (num < 0.2) {
          color = ColorType.WHITE;
        } else if (num < 0.4) {
          color = ColorType.PRIMARY;
        } else if (num < 0.6) {
          color = ColorType.SECONDARY;
        } else {
          color = ColorType.EMPTY;
        }
      }
    }

    const currentType = getRandomTetrominoType();
    const nextType = getRandomTetrominoType();

    return {
      board: board,
      currentType: currentType,
      nextType: nextType,
      correctCurrentPlacement: new MoveableTetromino(currentType, 0, 0, 0),
      correctNextPlacement: new MoveableTetromino(nextType, 0, 0, 0),
      elo: 1000
    }
  }

  // FOR TESTING PURPOSES ONLY
  // return random puzzle after one second
  async fetchPuzzle(): Promise<PuzzleDefinition> {

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.generateTestPuzzle());
      }, 1000);
    });
  }
}
