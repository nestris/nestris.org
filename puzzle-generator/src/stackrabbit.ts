import { InputSpeed, INPUT_SPEED_TO_TIMELINE } from '../../shared/models/input-speed';
import { TetrominoType } from '../../shared/tetris/tetromino-type';
import { TETROMINO_CHAR } from '../../shared/tetris/tetrominos';

const cModule = require("../binaries/cRabbit");

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

  //console.log("getTopMovesHybrid");

  // for each character of boardString that is '2' or '3', replace with '1'
  boardString = boardString.replace(/2|3/g, '1');

  // Convert input speed to timeline
  const inputTimeline = INPUT_SPEED_TO_TIMELINE[inputSpeed];

  const query = `${boardString}|${level}|${lines}|${currentPiece}|${nextPiece}|${inputTimeline}|${playoutCount}|${depth}`;
  return cModule.getTopMovesHybrid(query);

  const url = new URL("https://stackrabbit.net/engine-movelist-cpp-hybrid");
  url.searchParams.append("board", boardString);
  url.searchParams.append("level", level.toString());
  url.searchParams.append("lines", lines.toString());
  url.searchParams.append("currentPiece", TETROMINO_CHAR[currentPiece]);
  url.searchParams.append("nextPiece", TETROMINO_CHAR[nextPiece]);
  url.searchParams.append("inputFrameTimeline", inputTimeline);
  url.searchParams.append("playoutCount", playoutCount.toString());
  url.searchParams.append("playoutDepth", depth.toString());

  const result = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return await result.json();
}

export async function getMove(
  boardString: string,
  level: number,
  lines: number,
  currentPiece: TetrominoType,
  nextPiece: TetrominoType,
  inputSpeed: InputSpeed = InputSpeed.HZ_30,
) {

  const REACTION_TIME = 10;

  boardString = boardString.replace(/2|3/g, '1');
  
  const inputTimeline = INPUT_SPEED_TO_TIMELINE[inputSpeed];

  const url = new URL("http://localhost:3003/engine");
  url.searchParams.append("board", boardString);
  url.searchParams.append("level", level.toString());
  url.searchParams.append("lines", lines.toString());
  url.searchParams.append("currentPiece", TETROMINO_CHAR[currentPiece]);
  url.searchParams.append("nextPiece", TETROMINO_CHAR[nextPiece]);
  url.searchParams.append("inputFrameTimeline", inputTimeline);
  url.searchParams.append("reactionTime", REACTION_TIME.toString());

  const result = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const response = await result.json();

  let sequence = response[0].inputSequence;
  let placement = response[0].placement;
  console.log("Original sequence", sequence);
  console.log("Original placement", placement);
  if (response[0].adjustments) {

    // get the first REACTION_TIME frames of sequence
    sequence = sequence.slice(0, REACTION_TIME);

    // apply adjustments
    sequence += response[0].adjustments[0].inputSequence;
    console.log("Adjusted sequence", sequence);

    // apply placement
    placement = response[0].adjustments[0].placement;
    console.log("Adjusted placement", placement);
  }

  const MOVE_CHARS = "LEFRIGAB";

  // trim sequence string to the last occurence of a move character
  let lastMoveIndex = -1;
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (MOVE_CHARS.includes(sequence[i])) {
      lastMoveIndex = i;
      break;
    }
  }

  sequence = sequence.slice(0, lastMoveIndex + 1);
  console.log("Final sequence", sequence);
}