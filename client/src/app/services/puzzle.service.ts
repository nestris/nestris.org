import { Injectable } from '@angular/core';
import { PuzzleDefinition } from '../models/puzzles/puzzle';
import { BehaviorSubject, Observable } from 'rxjs';
import MoveableTetromino from '../models/tetris/moveable-tetromino';

const PUZZLE_TIME_LIMIT = 30;

@Injectable({
  providedIn: 'root'
})
export class PuzzleService {

  private puzzle$ = new BehaviorSubject<PuzzleDefinition | undefined>(undefined);
  private currentPuzzleTime$ = new BehaviorSubject<number>(0);

  private startPuzzleTime?: number;

  private submitted: boolean = false;

  constructor() { }

  startPuzzle(puzzle: PuzzleDefinition) {

    if (this.getPuzzle()) {
      throw new Error("Puzzle already started");
    }

    this.submitted = false;

    this.startPuzzleTime = Date.now();

    // start timer
    this.currentPuzzleTime$.next(0);

    // start timer
    const interval = setInterval(() => {
      this.currentPuzzleTime$.next((Date.now() - this.startPuzzleTime!) / 1000);
    }, 10);

    // stop timer when puzzle is finished
    this.currentPuzzleTime$.subscribe((currentPuzzleTime) => {
      if (currentPuzzleTime >= PUZZLE_TIME_LIMIT) {
        this.submitPuzzle(undefined, undefined);
        clearInterval(interval);
      }
    });

    // start puzzle
    this.puzzle$.next(puzzle);
  }

  getPuzzle$(): Observable<PuzzleDefinition | undefined> {
    return this.puzzle$.asObservable();
  }

  getPuzzle(): PuzzleDefinition | undefined {
    return this.puzzle$.getValue();
  }

  getCurrentPuzzleTime$(): Observable<number> {
    return this.currentPuzzleTime$.asObservable();
  }

  getPuzzleTimeLimit(): number {
    return PUZZLE_TIME_LIMIT;
  }

  private evaluatePuzzleResult(firstPlacement?: MoveableTetromino, secondPlacement?: MoveableTetromino): boolean {
    
    if (!this.getPuzzle()) {
      return false;
    }

    if (!firstPlacement || !secondPlacement) {
      return false;
    }

    const firstCorrect = firstPlacement.equals(this.getPuzzle()!.correctCurrentPlacement);
    const secondCorrect = secondPlacement.equals(this.getPuzzle()!.correctNextPlacement);
    return firstCorrect && secondCorrect;
  }

  submitPuzzle(firstPlacement?: MoveableTetromino, secondPlacement?: MoveableTetromino) {
    this.submitted = true;
    const isCorrect = this.evaluatePuzzleResult(firstPlacement, secondPlacement);

    console.log("submitPuzzle", isCorrect);
  }
}
