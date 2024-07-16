import { Request, Response } from 'express';
import { queryDB } from '../database';
import { getPlayerPuzzlesByUser } from './get-puzzles-by-user';
import { BinaryTranscoder } from '../../shared/network/tetris-board-transcoding/binary-transcoder';
import { BufferTranscoder } from '../../shared/network/tetris-board-transcoding/buffer-transcoder';
import { TetrominoType } from '../../shared/tetris/tetromino-type';
import { TETROMINO_CHAR } from '../../shared/tetris/tetrominos';

// add a user-created puzzle to the database
export async function addPlayerPuzzleRoute(req: Request, res: Response) {

  const username = req.body['username'] as string;
  const boardString = req.body['board'] as string;
  const currentPiece = parseInt(req.body['currentPiece'] as string) as TetrominoType;
  const nextPiece = parseInt(req.body['nextPiece'] as string) as TetrominoType;
  const r1 = req.body['r1'] as number;
  const x1 = req.body['x1'] as number;
  const y1 = req.body['y1'] as number;
  const r2 = req.body['r2'] as number;
  const x2 = req.body['x2'] as number;
  const y2 = req.body['y2'] as number;

  try {
    const result = await addPlayerPuzzleToDatabase(username, boardString, currentPiece, nextPiece, r1, x1, y1, r2, x2, y2);
    console.log(result);

    res.status(200).send(await getPlayerPuzzlesByUser(username));
  }
  catch (error) {
    res.status(500).send(error);
  }
}

// add either a user-created or randomly generated puzzle to the database
// if generated, username is undefined
export async function addPlayerPuzzleToDatabase(
  username: string,
  boardString: string,
  currentPiece: TetrominoType,
  nextPiece: TetrominoType,
  r1: number,
  x1: number,
  y1: number,
  r2: number,
  x2: number,
  y2: number
) {
  
  const currentChar = TETROMINO_CHAR[currentPiece];
  const nextChar = TETROMINO_CHAR[nextPiece];
  const boardBuffer = BufferTranscoder.encode(BinaryTranscoder.decode(boardString));

  // add puzzle to database
  const result = await queryDB("INSERT INTO player_puzzles (creator, board, current_piece, next_piece, r1, x1, y1, r2, x2, y2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
    [username, boardBuffer, currentChar, nextChar, r1, x1, y1, r2, x2, y2]
  );

  return result;
}
