import { Request, Response } from 'express';
import { InputSpeed, INPUT_SPEED_TO_TIMELINE } from '../../shared/models/input-speed';
import { TetrominoType } from '../../shared/tetris/tetromino-type';
import { TETROMINO_CHAR } from '../../shared/tetris/tetrominos';

require('dotenv').config();
const USE_BINARY = process.env['USE_BINARY'] === "true";

let cModule: any;
if (USE_BINARY) cModule = require("../../../../binaries/cRabbit");


export async function getTopMovesHybrid(
  boardString: string,
  level: number,
  lines: number,
  currentPiece: TetrominoType,
  nextPiece: TetrominoType,
  inputSpeed: InputSpeed = InputSpeed.HZ_30,
  playoutCount: number = 343,
  depth: number = 3
) {

  // for each character of boardString that is '2' or '3', replace with '1'
  boardString = boardString.replace(/2|3/g, '1');

  const startTime = Date.now();

  const inputTimeline = INPUT_SPEED_TO_TIMELINE[inputSpeed];

  if (USE_BINARY) {
    const query = `${boardString}|${level}|${lines}|${currentPiece}|${nextPiece}|${inputTimeline}|${playoutCount}|${depth}`;
    console.log("Query: ", query);
    return cModule.getTopMovesHybrid(query);
  }

  const url = new URL("https://stackrabbit.net/engine-movelist-cpp-hybrid");
  url.searchParams.append("board", boardString);
  url.searchParams.append("level", level.toString());
  url.searchParams.append("lines", lines.toString());
  url.searchParams.append("currentPiece", TETROMINO_CHAR[currentPiece]);
  url.searchParams.append("nextPiece", TETROMINO_CHAR[nextPiece]);
  url.searchParams.append("inputFrameTimeline", inputTimeline);
  url.searchParams.append("playoutCount", playoutCount.toString());
  url.searchParams.append("playoutDepth", depth.toString());

  console.log("URL: ", url.toString());
  const result = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return result.json();
}

// GET request
export async function getTopMovesHybridRoute(req: Request, res: Response) {
  // query parameters
  const boardString = req.query['boardString'] as string;
  const level = parseInt(req.query['level'] as string);
  const lines = parseInt(req.query['lines'] as string);
  const currentPiece = parseInt(req.query['currentPiece'] as string) as TetrominoType;
  const nextPiece = parseInt(req.query['nextPiece'] as string) as TetrominoType;
  
  const inputSpeed = parseInt(req.query['inputSpeed'] as string) as InputSpeed || InputSpeed.HZ_30;
  const playoutCount = parseInt(req.query['playoutCount'] as string) || 343;
  const depth = parseInt(req.query['depth'] as string) || 3;

  // try 3 times before giving up
  const MAX_TRIES = 3;
  let errorMessage;
  for (let i = 0; i < MAX_TRIES; i++) {
    try {
      const result = await getTopMovesHybrid(boardString, level, lines, currentPiece, nextPiece, inputSpeed, playoutCount, depth);
      res.send(result);
      return;
    } catch (error: any) {
      console.error(error.message);
      errorMessage = error.message;
    }

    // wait 0.5 second before trying again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  res.status(500).send(errorMessage);
  
}