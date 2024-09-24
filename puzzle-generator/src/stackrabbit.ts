import { InputSpeed, INPUT_SPEED_TO_TIMELINE } from '../../shared/models/input-speed';
import { TetrominoType } from '../../shared/tetris/tetromino-type';
import { TETROMINO_CHAR } from '../../shared/tetris/tetrominos';


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

  const inputTimeline = INPUT_SPEED_TO_TIMELINE[inputSpeed];

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
  return result.json();
}
