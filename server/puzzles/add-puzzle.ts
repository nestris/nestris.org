import { BinaryTranscoder } from '../../network-protocol/tetris-board-transcoding/binary-transcoder';
import { BufferTranscoder } from '../../network-protocol/tetris-board-transcoding/buffer-transcoder';
import { TetrominoType } from '../../network-protocol/tetris/tetromino-type';
import { TETROMINO_CHAR } from '../../network-protocol/tetris/tetrominos';
import { Request, Response } from 'express';
import { get } from 'http';
import { queryDB } from '../database';
import { getPuzzlesByUser } from './get-puzzles-by-user';

export async function addPuzzleRoute(req: Request, res: Response) {

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
  const elo = req.body['elo'] as number;

  try {
    const result = await addPuzzleToDatabase(username, boardString, currentPiece, nextPiece, r1, x1, y1, r2, x2, y2, elo);
    console.log(result);

    res.status(200).send(await getPuzzlesByUser(username));
  }
  catch (error) {
    res.status(500).send(error);
  }
}

export async function addPuzzleToDatabase(
  username: string,
  boardString: string,
  currentPiece: TetrominoType,
  nextPiece: TetrominoType,
  r1: number,
  x1: number,
  y1: number,
  r2: number,
  x2: number,
  y2: number,
  elo: number
) {
  
  const currentChar = TETROMINO_CHAR[currentPiece];
  const nextChar = TETROMINO_CHAR[nextPiece];
  const boardBuffer = BufferTranscoder.encode(BinaryTranscoder.decode(boardString));

  // add puzzle to database
  const result = await queryDB("INSERT INTO puzzles (creator, board, current_piece, next_piece, r1, x1, y1, r2, x2, y2, elo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
    [username, boardBuffer, currentChar, nextChar, r1, x1, y1, r2, x2, y2, elo]
  );

  return result;
}
