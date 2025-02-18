import { GameAbbrBoardSchema, GameCountdownSchema, GameFullBoardSchema, GamePlacementSchema, GameStartSchema, PACKET_NAME, PacketContent, PacketOpcode } from "src/app/shared/network/stream-packets/packet";
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
    ms: number; // the time in ms since the start of the game
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
    totalMs: number; // the total time in ms of the game
}

/**
 * Get the frame index to display when sifting through placements.
 * @param frames The frames of the game leading up to the placement
 * @param isolatedBoard The isolated board state without the active piece
 * @param placement The placement of the piece
 * @returns 
 */
function getPlacementFrameIndex(frames: Frame[], isolatedBoard: TetrisBoard, pieceType: TetrominoType, placement: MoveableTetromino): number {
    // Place the active piece on the board
    const placementBoard = isolatedBoard.copy();
    placement.blitToBoard(placementBoard);

    // Find the first frame where resultant board matches the frame's board
    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (frame.encodedBoard && BufferTranscoder.decode(frame.encodedBoard).equals(placementBoard)) return i;
        if (frame.mtPose && MoveableTetromino.fromMTPose(pieceType, frame.mtPose).equals(placement)) return i;
    }

    throw new Error('Placement not found in frames');
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
    const status = new MemoryGameStatus(true, gameStartPacket.level);
    console.log('Game start packet at index', startIndex, gameStartPacket);

    // The current board state without the active piece, to be updated with each placement
    let isolatedBoard = new TetrisBoard();

    // The current and next pieces, to be updated with each placement
    let current: TetrominoType = gameStartPacket.current;
    let next: TetrominoType = gameStartPacket.next;

    // The frames of the game, to be accumulated until a placement is found
    let frames: Frame[] = [];

    // The time since the start of the game, to be accumulated with each frame
    let msSinceStart: number = 0;

    // Add a frame, which can contain a board state or a MoveableTetromino, incrementing the time since the start
    const addFrame = (delta: number, encodedBoard?: Uint8Array, mtPose?: MTPose) => {
        frames.push({ delta, encodedBoard, mtPose, ms: msSinceStart });
        msSinceStart += delta;
    }

    // Add a frame with a full board
    const addBoardFrame = (delta: number, board: TetrisBoard) => {
        addFrame(delta, BufferTranscoder.encode(board));
    }

    // Add a frame with a MoveableTetromino
    const addMTFrame = (delta: number, mtPose: MTPose) => {
        addFrame(delta, undefined, mtPose);
    }

    // Add a spacer frame with the given delta
    const addSpacerFrame = (delta: number) => {
        if (frames.length === 0) addFrame(delta);
        else {
            const lastFrame = frames[frames.length - 1];
            addFrame(delta, lastFrame.encodedBoard, lastFrame.mtPose);
        }
    }

    // Iterate until first frame where first row is empty, then go back one frame
    let firstEmptyRowFrameIndex = startIndex;
    while (firstEmptyRowFrameIndex < packets.length) {
        const packet = packets[firstEmptyRowFrameIndex];
        if (packet.opcode === PacketOpcode.GAME_FULL_BOARD) {
            const board = (packet.content as GameFullBoardSchema).board;
            if (board.isRowEmpty(0)) break;
        }
        if (packet.opcode === PacketOpcode.GAME_ABBR_BOARD) {
            const mtPose = (packet.content as GameAbbrBoardSchema).mtPose;
            if (MoveableTetromino.fromMTPose(current, mtPose).getCurrentBlockSet().minY > 0) break;
        }
        firstEmptyRowFrameIndex++;
    }

    // Get the first frame before firstEmptyRowFrameIndex that is a GameFullBoard or GameAbbrBoard to get MT at the top
    let firstMTFrameIndex = firstEmptyRowFrameIndex - 1;
    while (firstMTFrameIndex >= 0) {
        const packet = packets[firstMTFrameIndex];
        if ([PacketOpcode.GAME_ABBR_BOARD, PacketOpcode.GAME_FULL_BOARD].includes(packet.opcode)) break;
        firstMTFrameIndex--;
    }

    // If a frame with full board or abbreviated board was found, add it to the frames
    if (firstMTFrameIndex >= 0) {
        const packet = packets[firstMTFrameIndex];
        if (packet.opcode === PacketOpcode.GAME_FULL_BOARD) addBoardFrame(0, (packet.content as GameFullBoardSchema).board);
        else if (packet.opcode === PacketOpcode.GAME_ABBR_BOARD) addMTFrame(0, (packet.content as GameAbbrBoardSchema).mtPose);
    }

    console.log('First empty row frame index', firstEmptyRowFrameIndex);

    // Iterate through the packets, adding frames and placements as necessary
    for (let i = firstEmptyRowFrameIndex; i < packets.length; i++) {
        const packet = packets[i];

        // console.log("placement", placements.length, "frame", frames.length, PACKET_NAME[packet.opcode], JSON.stringify(packet.content));

        if (packet.opcode === PacketOpcode.GAME_START) throw new Error('Multiple GameStart packets found');

        // Add a full board frame
        else if (packet.opcode === PacketOpcode.GAME_FULL_BOARD) {
            const fullBoard = packet.content as GameFullBoardSchema;
            addBoardFrame(fullBoard.delta, fullBoard.board);
        }

        // Add a abbreviated board frame
        else if (packet.opcode === PacketOpcode.GAME_ABBR_BOARD) {
            const abbrBoard = packet.content as GameAbbrBoardSchema;
            addMTFrame(abbrBoard.delta, abbrBoard.mtPose);
        }

        // Add a spacer frame for countdowns
        else if (packet.opcode === PacketOpcode.GAME_COUNTDOWN) {
            const countdown = packet.content as GameCountdownSchema;
            addSpacerFrame(countdown.delta);
        }

        // If the packet contains a placement, create the new placement with all the accumulated frames
        else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
            const placement = packet.content as GamePlacementSchema;

            const placementMT = MoveableTetromino.fromMTPose(current, placement.mtPose);

            let placementFrameIndex: number;
            try {
                placementFrameIndex = getPlacementFrameIndex(frames, isolatedBoard, current, placementMT);
            } catch (e) { // if placement not found, use the last frame. Happens close to top out
                placementFrameIndex = frames.length - 1;
            }
            

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
                placementFrameIndex: placementFrameIndex,
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
                //throw new Error('Placement is not legal on the current board');
                // If not valid, something went wrong. But, salvage earlier parts of the game and just cutoff here.
                return { placements, status, totalMs: msSinceStart };
            }

            // Place piece on board and clear lines, and update pushdown points
            placementPiece.blitToBoard(isolatedBoard);
            const linesCleared = isolatedBoard.processLineClears();
            status.onLineClear(linesCleared);
            status.onPushdown(placement.pushdown);

            status.onPlacement();

            // Cycle current and next pieces
            current = next;
            next = placement.nextNextType;
        }
    }

    return { placements, status, totalMs: msSinceStart };
}
