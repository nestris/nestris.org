import { StackrabbitService } from "src/app/services/stackrabbit/stackrabbit.service";
import { EngineMove } from "./puzzle-strategy";
import { decodePuzzle } from "src/app/shared/puzzles/encode-puzzle";
import { InputSpeed } from "src/app/shared/models/input-speed";

// Given a puzzle id and level, compute engine moves client-side
export async function computeEngineMoves(
    stackrabbitService: StackrabbitService,
    puzzleID: string,
    level: number
): Promise<EngineMove[]> {

    const { board, current, next } = decodePuzzle(puzzleID);
  
    // Compute engine moves for the puzzle
    const stackrabbit = await stackrabbitService.getTopMovesHybrid({
        board: board,
        currentPiece: current,
        nextPiece: next,
        level: level,
        inputSpeed: InputSpeed.HZ_30,
        playoutDepth: 3,
    });

    if (!stackrabbit.nextBox) throw new Error('Stackrabbit failed to compute moves');
    return stackrabbit.nextBox;
}