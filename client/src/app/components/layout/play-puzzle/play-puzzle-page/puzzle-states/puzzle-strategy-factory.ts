import { ParamMap } from "@angular/router";
import { PuzzleStrategyType } from "./puzzle-strategy-type";
import { RatedPuzzleStrategy } from "./rated-puzzle-strategy";
import { SinglePuzzleStrategy } from "./single-puzzle-strategy";
import { PuzzleStrategy } from "./puzzle-strategy";
import { StackrabbitService } from "src/app/services/stackrabbit/stackrabbit.service";

export function puzzleStrategyFactory(
    type: PuzzleStrategyType,
    stackrabbitService: StackrabbitService,
    params: ParamMap
): PuzzleStrategy | null {
    
    switch (type) {
        case PuzzleStrategyType.RATED:
            return new RatedPuzzleStrategy(stackrabbitService, params);
        case PuzzleStrategyType.SINGLE:
            return new SinglePuzzleStrategy(stackrabbitService, params);
        default: return null;
    }
}