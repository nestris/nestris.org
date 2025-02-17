import { Keybind } from "../../shared/emulator/keybinds";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { TETROMINO_CHAR } from "../../shared/tetris/tetrominos";

export interface Placement {
    inputFrameTimeline: string; // i.e X..X., the timeline of inputs to make that is passed into SR, and should be used to determine inputs
    shiftMap: Map<number, Keybind[]> | null; // a map of frame index to the keybinds to press at that frame
    computed: boolean; // whether the placement was already computed, or still awaiting engine response
}

export interface AIPlacement {
    placement: MoveableTetromino | null, accuracyScore: number
}

/**
 * Handles generating the placements for each position in the game, and the move sequence for each placement.
 */
export abstract class PlacementAI {

    // A map of placement index to the placement data
    readonly placements = new Map<number, Placement>();

    constructor(
        private onPlacementComputed: (placement: AIPlacement) => void = () => { }
    ) {}

    // Generates a series of X and . characters to represent the input frame timeline. Can be random or deterministic.
    protected abstract generateInputFrameTimeline(): string;

    protected abstract computePlacement(
        board: TetrisBoard,
        current: TetrominoType,
        next: TetrominoType | null,
        level: number,
        lines: number,
        inputFrameTimeline: string,
    ): Promise<AIPlacement>;

    /**
     * Compute the shift map for a given input frame timeline and the lock placement
     * @param inputFrameTimeline The input frame timeline to compute the shift map for
     * @param move The lock placement to compute the shift map for
     */
    protected abstract computeShiftMap(inputFrameTimeline: string, lockPlacement: MoveableTetromino): Map<number, Keybind[]>;

    /**
     * Register the board state and current and next pieces for a given placement index, to initiate
     * the process of computing the move sequence for that placement.
     */
    public registerPlacementPosition(index: number, board: TetrisBoard, current: TetrominoType, next: TetrominoType | null, level: number, lines: number) {
        
        // Generate the input frame timeline for this placement
        const inputFrameTimeline = this.generateInputFrameTimeline();

        // Assert timeline is only X and . characters
        if (!inputFrameTimeline.match(/^[X.]+$/)) {
            throw new Error(`Invalid input frame timeline: ${inputFrameTimeline}`);
        }

        console.log(`Registering placement at index ${index} with pieces ${TETROMINO_CHAR[current]} ${next === null ? 'nnb' : TETROMINO_CHAR[next]} timeline ${inputFrameTimeline}`);

        // Create the initial placement result with default of no shifts
        this.placements.set(index, { inputFrameTimeline, shiftMap: null, computed: false });

        // Compute the placement for this position
        this.computePlacement(board, current, next, level, lines, inputFrameTimeline).then(move => {

            // Update the placement with the computed shifts
            const placement = this.placements.get(index);
            if (!placement) throw new Error(`Placement at index ${index} not found`);
            placement.shiftMap = move.placement === null ? new Map() : this.computeShiftMap(inputFrameTimeline, move.placement);
            //console.log(`Computed shift map for placement at index ${index}: ${Array.from(placement.shiftMap.entries()).map(([frame, keybinds]) => `${frame}: ${keybinds.map(keybind => keybind).join(' ')}`).join(', ')}`);

            // Call the callback
            this.onPlacementComputed(move);
        });
    }

    /**
     * Get what keybind to press for a given placement index and frame index.
     * @param placementIndex The index of the placement to get the input for.
     * @param frameIndex The index of the frame to get the input for.
     * @returns The keybind to press for the given placement and frame, or null for no input.
     */
    public getInputForPlacementAndFrame(placementIndex: number, frameIndex: number): Keybind[] {
        // Return the keybinds to press for the given frame index
        return this.placements.get(placementIndex)?.shiftMap?.get(frameIndex) ?? [];
    }

}