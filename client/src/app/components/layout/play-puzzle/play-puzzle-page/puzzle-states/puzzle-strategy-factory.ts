import { ParamMap } from "@angular/router";
import { PuzzleStrategyType } from "./puzzle-strategy-type";
import { RatedPuzzleStrategy } from "./rated-puzzle-strategy";
import { SinglePuzzleStrategy } from "./single-puzzle-strategy";
import { PuzzleStrategy } from "./puzzle-strategy";
import { StackrabbitService } from "src/app/services/stackrabbit/stackrabbit.service";
import { Injector } from "@angular/core";

export function puzzleStrategyFactory(
    type: PuzzleStrategyType,
    injector: Injector,
    params: ParamMap
): PuzzleStrategy | null {

    switch (type) {
        case PuzzleStrategyType.RATED:
            return new RatedPuzzleStrategy(injector, params);
        case PuzzleStrategyType.SINGLE:
            return new SinglePuzzleStrategy(injector, params);
        default: return null;
    }
}