import axios from "axios";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { decodeStackrabbitResponse, TopMovesHybridResponse } from "../../shared/scripts/stackrabbit-decoder";

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
    inputTimeline: string = "X.",
    depth: number = 3,
): Promise<TopMovesHybridResponse> {

    // Encode into 0s and 1s
    const encodedBoard = BinaryTranscoder.encode(board, true);
    const playoutCount = Math.pow(7, depth);

    const request = `http://cpp-service:4500/top-moves-hybrid?board=${encodedBoard}&currentPiece=${current}&nextPiece=${next}&level=${level}&inputFrameTimeline=${inputTimeline}&depth=${depth}&playoutCount=${playoutCount}`;

    // fetch from server
    const startTime = Date.now();
    const response = await axios.get(request);

    const topMovesHybrid = decodeStackrabbitResponse(response.data, current, next);
    console.log(`Fetched topMovesHybrid depth ${depth} in ${Date.now() - startTime}ms`);

    return topMovesHybrid;
}