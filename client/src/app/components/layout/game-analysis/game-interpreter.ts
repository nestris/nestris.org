import { GamePlacementSchema, GameStartSchema, PacketContent, PacketOpcode } from "src/app/shared/network/stream-packets/packet";
import { BufferTranscoder } from "src/app/shared/network/tetris-board-transcoding/buffer-transcoder";
import GameStatus from "src/app/shared/tetris/game-status";
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
    board?: TetrisBoard; // if present, this is the board to be displayed for this frame
    mtPose?: MTPose; // if present, this is the MoveableTetromino to be placed on the isolated board for this frame
}

/**
 * Represents a single placement played in a past game, including placement info and the board state over time
 * as the piece is placed.
 */
export interface AnalysisPlacement {
    encodedBoard: Uint8Array; // the board without the active piece, encoded as a Uint8Array to save space
    current: TetrominoType; // the type of the current piece
    next: TetrominoType; // the type of the next piece
    score: number; // the score before the placement
    level: number; // the level before the placement
    lines: number; // the number of lines before the placement
    placement: MTPose; // the placement of the piece
    frames: Frame[]; // the frames of the game leading up to this placement
    placementFrameIndex: number; // the index of the frame where the piece is placed, used when going through placements
}

/**
 * Process a list of packets and return the game state throughout the entire game.
 * @param packets The full list of packets for the game
 */
export function interpretPackets(packets: PacketContent[]): AnalysisPlacement[] {
    const placements: AnalysisPlacement[] = [];

    // Read until the first GameStart packet
    let startIndex = 0;
    while (startIndex < packets.length && packets[startIndex].opcode !== PacketOpcode.GAME_START) startIndex++;
    if (startIndex === packets.length) {
        console.error('No GameStart packet found');
        return [];
    }
    
    // Start level/lines/score counters at start level and 0
    const gameStartPacket = packets[startIndex].content as GameStartSchema;
    const status = new SmartGameStatus(gameStartPacket.level);
    console.log('Game start packet at index', startIndex, gameStartPacket);

    // The current board state without the active piece, to be updated with each placement
    let isolatedBoard = new TetrisBoard();

    // The current and next pieces, to be updated with each placement
    let current: TetrominoType = gameStartPacket.current;
    let next: TetrominoType = gameStartPacket.next;

    let frames: Frame[] = [];
    for (let i = startIndex + 1; i < packets.length; i++) {
        const packet = packets[i];

        if (packet.opcode === PacketOpcode.GAME_START) throw new Error('Multiple GameStart packets found');

        // TODO: Implement the rest of the packet types

        // If the packet contains a placement, create the new placement with all the accumulated frames
        else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
            const placement = packet.content as GamePlacementSchema;

            // GAME_PLACEMENT packet is a timed packet (has a duration), so we add a spacer frame with the duration of the packet
            frames.push({ delta: placement.delta });

            // Create the new placement
            const newPlacement: AnalysisPlacement = {
                encodedBoard: BufferTranscoder.encode(isolatedBoard),
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
    

    return placements;
}
