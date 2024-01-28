import { Injectable } from '@angular/core';
import { PuzzleDefinition, PuzzleResult, PuzzleSolution, PuzzleSubmission } from '../models/puzzles/puzzle';
import { ColorType, TetrisBoard } from '../models/tetris/tetris-board';
import { TetrominoType, getRandomTetrominoType } from '../models/tetris/tetromino-type';
import MoveableTetromino from '../models/tetris/moveable-tetromino';
import { evaluatePuzzleSubmission } from '../models/puzzles/evaluate-puzzle-submission';
import { BehaviorSubject, Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PuzzleService {

  private eloHistory: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([1000]);

  constructor() {
    this.syncEloHistory();
  }

  // observable that emits elo history
  getEloHistory$(): Observable<number[]> {
    return this.eloHistory.asObservable();
  }

  // observable that emits current elo
  getCurrentElo$(): Observable<number> {
    return this.eloHistory.asObservable().pipe(
      // get last element of array
      map((eloHistory) => eloHistory[eloHistory.length - 1])
    );
  }

  // get current elo (not observable)
  getCurrentElo(): number {
    return this.eloHistory.getValue()[this.eloHistory.getValue().length - 1];
  }

  // fetch elo history from server
  async syncEloHistory() {
    // TODO
  }

  // FOR TESTING ONLY
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

    const correctSolution: PuzzleSolution = {
      votes: 5,
      score: 3.24,
      firstPiece: MoveableTetromino.fromSpawnPose(currentType),
      secondPiece: MoveableTetromino.fromSpawnPose(nextType),
      comment: "[Comment on correct answer here]"
    }

    return {
      board: board,
      currentType: currentType,
      nextType: nextType,
      correctSolution: correctSolution,
      incorrectSolutions: [],
      elo: 1000,
      eloGain: 31,
      eloLoss: 28,
      attempts: 4,
      successes: 3
    }
  }

  // fetch a puzzle from the server
  async fetchPuzzle(): Promise<PuzzleDefinition> {

    // FOR TESTING PURPOSES ONLY
    // return random puzzle after one second

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.generateTestPuzzle());
      }, 1000);
    });
  }


  async submitPuzzle(puzzle: PuzzleDefinition, submission: PuzzleSubmission): Promise<PuzzleResult> {
    
    const result = evaluatePuzzleSubmission(puzzle, submission);
    console.log("submitPuzzle", result);

    // TODO: submit puzzle to server

    // update elo history
    const eloChange = result.isCorrect ? puzzle.eloGain : -puzzle.eloLoss;
    const newElo = this.getCurrentElo() + eloChange;
    console.log("newElo", newElo, "eloChange", eloChange);

    // update cached client-side elo history for instant update client-side
    this.eloHistory.next([...this.eloHistory.getValue(), newElo]);

    // start syncing elo history with server, but don't wait for it to finish
    this.syncEloHistory();

    return result;
  }

}
