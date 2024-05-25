/*
Given a stream of packets, maintain the most recent version of game state
Used on both server and client on recieving packets
*/

import GameStatus from "client/src/app/models/scoring/game-status";
import { GameFullBoardSchema, GamePlacementSchema, GameStartSchema, NonGameBoardStateChangeSchema, PacketContent, PacketOpcode } from "network-protocol/stream-packets/packet";
import MoveableTetromino from "network-protocol/tetris/moveable-tetromino";
import { TetrisBoard } from "network-protocol/tetris/tetris-board";
import { TetrominoType } from "network-protocol/tetris/tetromino-type";
import { GameState } from "./game-state";


// Proccesses packet stream and stores game/non-game state derived from packets
export class GameStateFromPackets {

  // if in a game, the game state. if undefined, not in game
  private game?: GameState;

  // state for when not in game
  private nonGameBoard: TetrisBoard = new TetrisBoard();
  private nonGameNext: TetrominoType = TetrominoType.ERROR_TYPE;
  private nonGameStatus: GameStatus = new GameStatus();


  constructor() {
  }

  // whether we are currently in a game
  inGame(): boolean {
    return this.game !== undefined;
  }

  // GETTERS for current state
  getBoard(): TetrisBoard {
    return this.inGame() ? this.game!.getCurrentBoard() : this.nonGameBoard;
  }

  getNext(): TetrominoType {
    return this.inGame() ? this.game!.getCurrentType() : this.nonGameNext;
  }

  getStatus(): GameStatus {
    return this.inGame() ? this.game!.getStatus().status : this.nonGameStatus;
  }

  // called when packet is received. updates state
  onPacket(packet: PacketContent) {

    switch (packet.opcode) {

      // on game start, initialize game state
      case PacketOpcode.GAME_START:
        const data = packet.content as GameStartSchema;
        this.game = new GameState(data.level, data.current, data.next);

        // nullify non-game state
        this.nonGameBoard = new TetrisBoard();
        this.nonGameNext = TetrominoType.ERROR_TYPE;
        this.nonGameStatus = new GameStatus();
        break;

      // on game end, set game to undefined, so that non-game state is used instead
      case PacketOpcode.GAME_END:
        this.game = undefined;
        break;

      // when receiving non-game board state, update board
      case PacketOpcode.NON_GAME_BOARD_STATE_CHANGE:
        if (this.inGame()) throw new Error("Cannot process NON_GAME_BOARD_STATE_CHANGE packet, must not be in game");
        this.nonGameBoard = (packet.content as NonGameBoardStateChangeSchema).board;
        break;

      // when receiving GAME_FULL_BOARD, update board in game if in game
      case PacketOpcode.GAME_FULL_BOARD:
        if (!this.inGame()) throw new Error("Cannot process GAME_FULL_BOARD packet, must be in game");
        const board = (packet.content as GameFullBoardSchema).board;
        this.game!.onFullBoardUpdate(board);
        break;
      
      // when receiving placement, update if in game
      case PacketOpcode.GAME_PLACEMENT:
        if (!this.inGame()) throw new Error("Cannot process GAME_FULL_BOARD packet, must be in game");
        const activePieceData = (packet.content as GamePlacementSchema);
        const activePiece = new MoveableTetromino(this.game!.getCurrentType(), activePieceData.rotation, activePieceData.x, activePieceData.y);
        this.game!.onAbbreviatedBoardUpdate(activePiece);
        break;

      // TODO: abbreviated game board, and other packets

      // Otherwise, do nothing
      default:
        break;

    }

  }

}