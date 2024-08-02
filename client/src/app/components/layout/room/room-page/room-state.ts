// Handles binary messages from server and decodes into current game state for players in the room

import { ChangeDetectorRef } from "@angular/core";
import { GameState, GameStateSnapshot } from "src/app/shared/game-state-from-packets/game-state";
import { PacketContent, PACKET_NAME, PacketOpcode, GameStartSchema, GameRecoverySchema, GamePlacementSchema, GameFullBoardSchema, GameAbbrBoardSchema, GameCountdownSchema } from "src/app/shared/network/stream-packets/packet";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import { PacketReplayer } from "src/app/util/packet-replayer";

const defaultState: GameStateSnapshot = { 
  level: 0,
  lines: 0,
  score: 0,
  board: new TetrisBoard(),
  next: TetrominoType.ERROR_TYPE,
  countdown: 0,
};

/*
Stores the most up-to-date-versions of each player's states from the room, and processes packets
from server that update each player's state. This is not a reactive object, so must notify for changes
manually after calling onPacket()
*/
export class ClientRoomState {

  // map between each player index and their current game state
  playerStates: (GameState | null)[] = [];
  packetReplayers: PacketReplayer[] = [];
  playerSnapshots: (GameStateSnapshot | null)[] = [];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly numPlayers: number,
    bufferDelay: number
  ) {

    // initialize the player state objects
    for (let i = 0; i < this.numPlayers; i++) {

      this.playerStates.push(null);
      this.playerSnapshots.push(null);

      // create a PacketReplayer for each player that will buffer packets from the server
      this.packetReplayers.push(new PacketReplayer((packets) => {
        // when PacketReplayer decides it is time for a packet(s) to be executed,
        // update the player state with the packet(s)
        packets.forEach((packet) => this.processPacket(i, packet));

        // notify the change detector that the player state has been updated
        this.cdr.detectChanges();
      }, bufferDelay));
    }
  }


  private processPacket(packetIndex: number, packet: PacketContent) {

    // Can only transition null -> GameStartPacket or null -> GameRecoveryPacket
    // Otherwise, ignore the packet
    if (this.playerStates[packetIndex] === null && ![PacketOpcode.GAME_START, PacketOpcode.GAME_RECOVERY].includes(packet.opcode)) {
      console.error(`Invalid packet received for player ${packetIndex}: ${PACKET_NAME[packet.opcode]}`);
      return;
    }
      
    const game = this.playerStates[packetIndex];
    if (packet.opcode === PacketOpcode.GAME_START) {
      const gameStart = packet.content as GameStartSchema;
      this.playerStates[packetIndex] = new GameState(gameStart.level, gameStart.current, gameStart.next);
    } else if (packet.opcode === PacketOpcode.GAME_RECOVERY) {
      const gameRecovery = packet.content as GameRecoverySchema;
      if (game === null) this.playerStates[packetIndex] = GameState.fromRecovery(gameRecovery);
      else game.onRecovery(gameRecovery);
    } else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
      const placement = (packet.content as GamePlacementSchema);
      const activePiece = MoveableTetromino.fromMTPose(game!.getCurrentType(), placement.mtPose);
      game!.onPlacement(activePiece.getMTPose(), placement.nextNextType);
    } else if (packet.opcode === PacketOpcode.GAME_COUNTDOWN) {
      game!.setCountdown((packet.content as GameCountdownSchema).countdown);
    } else if (packet.opcode === PacketOpcode.GAME_FULL_BOARD) {
      const board = (packet.content as GameFullBoardSchema).board;
      game!.onFullBoardUpdate(board);
    } else if (packet.opcode === PacketOpcode.GAME_ABBR_BOARD) {
      const mtPose = (packet.content as GameAbbrBoardSchema).mtPose;
      game!.onAbbreviatedBoardUpdate(mtPose);
    } else if (packet.opcode === PacketOpcode.GAME_END) {
      this.playerSnapshots[packetIndex] = game!.getSnapshot();
      this.playerStates[packetIndex] = null;
    } else {
      console.error(`Invalid packet received for player ${packetIndex}: ${PACKET_NAME[packet.opcode]}`);
    }
  }

  // when a packet is received from the server, queue it into the appropriate player's PacketReplayer
  onReceivePacket(packetIndex: number, packet: PacketContent) {

    // add the packet to the PacketReplayer queue, to be executed when the PacketReplayer decides
    this.packetReplayers[packetIndex].ingestPacket(packet);

  }

  getPacketReplayer(playerIndex: number): PacketReplayer {
    return this.packetReplayers[playerIndex];
  }

  // Get the current game state, or the most recent game's state if the game has ended, else just an empty board
  player(playerIndex: number): GameStateSnapshot {
    return this.playerStates[playerIndex]?.getSnapshot() ?? this.playerSnapshots[playerIndex] ?? defaultState;
  }

}