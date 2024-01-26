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

  private timerInterval: any;

  constructor() { }

  startPuzzle(puzzle: PuzzleDefinition) {

    if (this.getPuzzle()) {
      console.log("Puzzle already started");
      return;
    }

    console.log("startPuzzle", puzzle);

    this.submitted = false;

    this.startPuzzleTime = Date.now();

    // start timer
    this.currentPuzzleTime$.next(0);

    // start timer
    this.timerInterval = setInterval(() => {
      let time = (Date.now() - this.startPuzzleTime!) / 1000;
      time = Math.min(time, PUZZLE_TIME_LIMIT);
      this.currentPuzzleTime$.next(time);
      // console.log("timer", time);
    }, 20);

    // stop timer when puzzle is finished
    this.currentPuzzleTime$.subscribe((currentPuzzleTime) => {
      if (currentPuzzleTime >= PUZZLE_TIME_LIMIT) {
        this.submitPuzzle(undefined, undefined);
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
    clearInterval(this.timerInterval);

    const isCorrect = this.evaluatePuzzleResult(firstPlacement, secondPlacement);

  }

  resetPuzzle() {
    clearInterval(this.timerInterval);
    this.submitted = false;
    this.puzzle$.next(undefined);
    console.log("resetPuzzle");
  }
}
