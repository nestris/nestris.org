import { Request, Response } from 'express';
import { TetrominoType } from "client/src/app/models/tetris/tetromino-type";
import { INPUT_SPEED_TO_TIMELINE, InputSpeed } from "../../network-protocol/models/input-speed";

const cModule = require("../../../../binaries/cRabbit");

export function cTest() {
  console.time("C++");
  const result = cModule.getLockValueLookup(
    "00000000000000000000000000000000000000000000000000000000000000011000000001100100000110110000011111000011111100011111110001111111001111111100111111111011111111101111111110111111111011111111101111111110|19|192|2|0|X.|"
  );
  console.timeEnd("C++");
  console.log("----Result----");
  console.log(result);

  return result;
}

export function getTopMovesHybrid(
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
  const query = `${boardString}|${level}|${lines}|${currentPiece}|${nextPiece}|${inputTimeline}|${playoutCount}|${depth}`;
  console.log("Query: ", query);
  const result = cModule.getTopMovesHybrid(query);

  console.log("Time taken: ", Date.now() - startTime);
  console.log(result);

  return result;
}

// GET request
export function getTopMovesHybridRoute(req: Request, res: Response) {
  // query parameters
  const boardString = req.query['boardString'] as string;
  const level = parseInt(req.query['level'] as string);
  const lines = parseInt(req.query['lines'] as string);
  const currentPiece = parseInt(req.query['currentPiece'] as string);
  const nextPiece = parseInt(req.query['nextPiece'] as string);
  
  const inputSpeed = parseInt(req.query['inputSpeed'] as string) as InputSpeed || InputSpeed.HZ_30;
  const playoutCount = parseInt(req.query['playoutCount'] as string) || 343;
  const depth = parseInt(req.query['depth'] as string) || 3;

  const result = getTopMovesHybrid(boardString, level, lines, currentPiece, nextPiece, inputSpeed, playoutCount, depth);

  res.send(result);
}