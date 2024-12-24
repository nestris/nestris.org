import { GameAbbrBoardSchema, GameCountdownSchema, GameFullBoardSchema, GamePlacementSchema, GameStartSchema, PacketContent, PacketOpcode } from "src/app/shared/network/stream-packets/packet";
import { BufferTranscoder } from "src/app/shared/network/tetris-board-transcoding/buffer-transcoder";
import GameStatus from "src/app/shared/tetris/game-status";
import { MemoryGameStatus } from "src/app/shared/tetris/memory-game-status";
import MoveableTetromino, { MTPose } from "src/app/shared/tetris/moveable-tetromino";
import { SmartGameStatus } from "src/app/shared/tetris/smart-game-status";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";

/**
 * A single frame of a game with a delta indicating the time between this frame and the previous frame.
 * This frame can contain a board state or a MoveableTetromino, which updates the displayed board for this frame.
 */
export interface Frame {
    delta: number; // time in ms since the previous frame
    encodedBoard?: Uint8Array; // if present, this is the board encoded as Uint8Array to be displayed for this frame
    mtPose?: MTPose; // if present, this is the MoveableTetromino to be placed on the isolated board for this frame
}

/**
 * Represents a single placement played in a past game, including placement info and the board state over time
 * as the piece is placed.
 */
export interface AnalysisPlacement {
    encodedIsolatedBoard: Uint8Array; // the board without the active piece, encoded as a Uint8Array to save space
    current: TetrominoType; // the type of the current piece
    next: TetrominoType; // the type of the next piece
    score: number; // the score before the placement
    level: number; // the level before the placement
    lines: number; // the number of lines before the placement
    placement: MTPose; // the placement of the piece
    frames: Frame[]; // the frames of the game leading up to this placement
    placementFrameIndex: number; // the index of the frame where the piece is placed, used when going through placements
}

export interface InterpretedGame {
    placements: AnalysisPlacement[];
    status: MemoryGameStatus;
}

/**
 * Process a list of packets and return the game state throughout the entire game.
 * @param packets The full list of packets for the game
 */
export function interpretPackets(packets: PacketContent[]): InterpretedGame {
    const placements: AnalysisPlacement[] = [];

    // Read until the first GameStart packet
    let startIndex = 0;
    while (startIndex < packets.length && packets[startIndex].opcode !== PacketOpcode.GAME_START) startIndex++;
    if (startIndex === packets.length) {
        throw new Error('No GameStart packet found');
    }
    
    // Start level/lines/score counters at start level and 0. Use MemoryGameStatus to track these values over time
    const gameStartPacket = packets[startIndex].content as GameStartSchema;
    const status = new MemoryGameStatus(gameStartPacket.level);
    console.log('Game start packet at index', startIndex, gameStartPacket);

    // The current board state without the active piece, to be updated with each placement
    let isolatedBoard = new TetrisBoard();

    // The current and next pieces, to be updated with each placement
    let current: TetrominoType = gameStartPacket.current;
    let next: TetrominoType = gameStartPacket.next;

    let frames: Frame[] = [];

    // A spacer frame takes in a delta but maintains the previous board state
    const getSpacerFrame = (delta: number): Frame => {
        // If this is the first frame, return a frame with just the delta
        if (frames.length === 0) return { delta };
        // Otherwise, return a frame with the previous board state and the delta
        const lastFrame = frames[frames.length - 1];
        return Object.assign({}, lastFrame, { delta });
    }

    for (let i = startIndex + 1; i < packets.length; i++) {
        const packet = packets[i];

        if (packet.opcode === PacketOpcode.GAME_START) throw new Error('Multiple GameStart packets found');

        // Add a full board frame
        else if (packet.opcode === PacketOpcode.GAME_FULL_BOARD) {
            const fullBoard = packet.content as GameFullBoardSchema;
            frames.push({ delta: fullBoard.delta, encodedBoard: BufferTranscoder.encode(fullBoard.board) });
        }

        // Add a abbreviated board frame
        else if (packet.opcode === PacketOpcode.GAME_ABBR_BOARD) {
            const abbrBoard = packet.content as GameAbbrBoardSchema;
            frames.push({ delta: abbrBoard.delta, mtPose: abbrBoard.mtPose });
        }

        // Add a spacer frame for countdowns
        else if (packet.opcode === PacketOpcode.GAME_COUNTDOWN) {
            const countdown = packet.content as GameCountdownSchema;
            frames.push(getSpacerFrame(countdown.delta));
        }

        // If the packet contains a placement, create the new placement with all the accumulated frames
        else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
            const placement = packet.content as GamePlacementSchema;

            // GAME_PLACEMENT packet is a timed packet (has a duration), so we add a spacer frame with the duration of the packet
            frames.push(getSpacerFrame(placement.delta));

            // Create the new placement
            const newPlacement: AnalysisPlacement = {
                encodedIsolatedBoard: BufferTranscoder.encode(isolatedBoard),
                current,
                next,
                score: status.score,
                level: status.level,
                lines: status.lines,
                placement: placement.mtPose,
                frames,
                placementFrameIndex: frames.length - 1 // TODO: find the frame which matches the valid placement
            };
            placements.push(newPlacement);

            // Reset the frames for the next placement
            frames = [];

            // Get the MoveableTetromino for the placement
            const placementPiece = MoveableTetromino.fromMTPose(current, placement.mtPose);

            // assert that placement is valid
            if (!placementPiece.isValidPlacement(isolatedBoard)) {
                isolatedBoard.print();
                placementPiece.print();
                throw new Error('Placement is not legal on the current board');
            }

            // Place piece on board and clear lines, and update pushdown points
            placementPiece.blitToBoard(isolatedBoard);
            const linesCleared = isolatedBoard.processLineClears();
            status.onLineClear(linesCleared);
            status.onPushdown(placement.pushdown);

            // Cycle current and next pieces
            current = next;
            next = placement.nextNextType;
        }
    }
    

    return { placements, status };
}
