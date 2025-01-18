import axios from "axios";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { decodeStackrabbitResponse, TopMovesHybridResponse } from "../../shared/scripts/stackrabbit-decoder";
import { INPUT_SPEED_TO_TIMELINE, InputSpeed } from "../../shared/models/input-speed";

require('dotenv').config();

const cppServicePort = process.env.CPP_SERVICE_PORT || '4500';
console.log(`cppServicePort: ${cppServicePort}`);


/**
 * Get top 5 NB and NNB moves from cpp-service
 * @returns The decoded response from the cpp-service
 * @throws Error if the request fails
 */
export async function getTopMovesHybrid(
    board: TetrisBoard,
    current: TetrominoType,
    next: TetrominoType,
    level: number = 18,
    lines: number = 0,
    inputTimeline: string = "X.",
    depth: number = 3,
    disableTuck: boolean = false
): Promise<TopMovesHybridResponse> {

    // Encode into 0s and 1s
    const encodedBoard = BinaryTranscoder.encode(board, true);
    const playoutCount = Math.pow(7, depth);

    const request = `http://cpp-service:4500/top-moves-hybrid?board=${encodedBoard}&currentPiece=${current}&nextPiece=${next}&level=${level}&lines=${lines}&inputFrameTimeline=${inputTimeline}&depth=${depth}&playoutCount=${playoutCount}&disableTuck=${disableTuck}`;

    // fetch from server
    const startTime = Date.now();
    const response = await axios.get(request);

    const topMovesHybrid = decodeStackrabbitResponse(response.data, current, next);
    console.log(`Fetched topMovesHybrid depth ${depth} in ${Date.now() - startTime}ms`);

    return topMovesHybrid;
}

export async function testStackrabbit() {
    const startTime = Date.now();
    for (let i = 0; i < 600; i++) {
        const board = TetrisBoard.random();
        try {
            await getTopMovesHybrid(
                board,
                TetrominoType.I_TYPE,
                TetrominoType.I_TYPE,
                18,
                0,
                INPUT_SPEED_TO_TIMELINE[InputSpeed.HZ_30],
                1
                );
        } catch (e) {
            console.error(e);
            board.print();
        }
        
    }
    console.log(`Tested 600 stackrabbit requests in ${Date.now() - startTime}ms`);
}