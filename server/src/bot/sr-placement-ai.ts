import { Keybind } from "../../shared/emulator/keybinds";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { getTopMovesHybrid } from "../scripts/stackrabbit";
import { AIPlacement, PlacementAI } from "./placement-ai";
import { TopMovesHybridResponse } from "../../shared/scripts/stackrabbit-decoder";
import { randomChoice, randomInt, weightedRandomChoice } from "../../shared/scripts/math";

export class SRPlacementAI extends PlacementAI {

    protected override generateInputFrameTimeline(): string {

        return "X..";

        let timeline = "";

        // 5 maximum inputs
        for (let i = 0; i < 5; i++) {

            const numDots = randomInt(3, 5);
            timeline += ".".repeat(numDots);
            timeline += "X";
        }

        return timeline;

    }

    protected override async computePlacement(
        board: TetrisBoard,
        current: TetrominoType,
        next: TetrominoType | null,
        level: number,
        lines: number,
        inputFrameTimeline: string
    ): Promise<AIPlacement> {

        if (next === null) throw new Error("Next piece must be provided for SRPlacementAI");

        const noPlacement: AIPlacement = {
            placement: null,
            bestEval: 10,
            playerEval: 0,
        }
        
        // Try to get the top move from stackrabbit
        let stackrabbit: TopMovesHybridResponse;
        try {
            // Disable tucks: tucks not supported with shift map yet
            stackrabbit = await getTopMovesHybrid(board, current, next, level, lines, inputFrameTimeline, 1, true);
        } catch (e) {
            // No placement found
            return noPlacement;
        }

        if (stackrabbit.nextBox.length === 0) return noPlacement;

        // Get best move
        const bestEval = stackrabbit.nextBox[0].score;
        const playerEval = bestEval - randomInt(0, 300) / 100;
        return {
            placement: stackrabbit.nextBox[0].firstPlacement,
            bestEval: stackrabbit.nextBox[0].score,
            playerEval: playerEval,
        }

        // Get a weighted random move from top moves based on score. The better the move, the more likely it is to be chosen.
        //const lowestEval = stackrabbit.nextBox[stackrabbit.nextBox.length - 1].score;
        //return weightedRandomChoice(stackrabbit.nextBox, stackrabbit.nextBox.map(move => Math.pow(move.score - lowestEval, 2))).firstPlacement;   
        
    }

    protected override computeShiftMap(inputFrameTimeline: string, lockPlacement: MoveableTetromino): Map<number, Keybind[]> {
        
        // Calculate the number of frames to shift, where sign indicates direction
        const spawnPiece = MoveableTetromino.fromSpawnPose(lockPlacement.tetrominoType);
        const numShifts = Math.abs(lockPlacement.getTranslateX() - spawnPiece.getTranslateX());
        const shiftDirection = lockPlacement.getTranslateX() > spawnPiece.getTranslateX() ? Keybind.SHIFT_RIGHT : Keybind.SHIFT_LEFT;

        // Calculate rotation
        const spawnRotation = spawnPiece.getRotation();
        const lockRotation = lockPlacement.getRotation();
        let numRotations = (lockRotation - spawnRotation + 4) % 4;
        let rotationDirection = Keybind.ROTATE_RIGHT;
        if (numRotations > 2) {
            numRotations = 4 - numRotations;
            rotationDirection = Keybind.ROTATE_LEFT;
        }

        const shiftMap = new Map<number, Keybind[]>();
        const addInputAtFrame = (frame: number, keybind: Keybind) => {
            if (!shiftMap.has(frame)) shiftMap.set(frame, []);
            shiftMap.get(frame)!.push(keybind);
        }

        let frameIndex = 0;
        let timelineIndex = 0;
        let currentShifts = 0;
        let currentRotations = 0;

        while (currentShifts < numShifts || currentRotations < numRotations) {

            // Able to input at this frame
            if (inputFrameTimeline[timelineIndex] === 'X') {

                // Rotate if needed
                if (currentRotations < numRotations) {
                    addInputAtFrame(frameIndex, rotationDirection);
                    currentRotations++;
                }

                // Shift
                if (currentShifts < numShifts) {
                    addInputAtFrame(frameIndex, shiftDirection);
                    currentShifts++;
                }
            }

            // Increment timeline index mod length
            timelineIndex = (timelineIndex + 1) % inputFrameTimeline.length;

            // Go to next frame
            frameIndex++;
        }

        return shiftMap;

    }

}