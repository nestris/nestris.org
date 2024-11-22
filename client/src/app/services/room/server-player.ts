import { BehaviorSubject, Observable } from "rxjs";
import { GameState, GameStateSnapshot } from "src/app/shared/game-state-from-packets/game-state";
import { GameAbbrBoardSchema, GameCountdownSchema, GameFullBoardSchema, GamePlacementSchema, GameRecoverySchema, GameStartSchema, PACKET_NAME, PacketContent, PacketOpcode } from "src/app/shared/network/stream-packets/packet";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import { PacketReplayer } from "src/app/util/packet-replayer";

/**
 * A ServerPlayer tracks game state of a player based on server-sent packets. It uses lag buffering to
 * smooth out the game state updates, and maintains the current state of the player.
 */
export class ServerPlayer {

    private snapshot$ = new BehaviorSubject<GameStateSnapshot>(this.getDefaultSnapshot());

    // The current game state of the player, or null if not in a game
    private state: GameState | null;

    // The replayer that buffers packets and updates the game state
    private replayer: PacketReplayer;

    // Stores the most recent snapshot of the game state, if the game has ended
    private previousSnapshot: GameStateSnapshot | null;
  
    // The constructor initializes the ServerPlayer with a buffer delay (in ms) for the PacketReplayer
    constructor(private readonly defaultLevel: number = 18, bufferDelay: number = 300) {

        // No ongoing game at initialization
        this.state = null;

        // No snapshot at initialization
        this.previousSnapshot = null;

        // Create a PacketReplayer to buffer packets from the server
        this.replayer = new PacketReplayer((packets) => {

            // When PacketReplayer decides it is time for a packet(s) to be executed, update the player state with the packet(s)
            packets.forEach((packet) => this.processPacket(packet));

        }, bufferDelay);
    }  
  
    /**
     * Process a packet received from the server. Updates the game state of the player based on the packet.
     * @param packet The packet received from the server
     */
    private processPacket(packet: PacketContent) {
  
      // Can only transition null -> GameStartPacket or null -> GameRecoveryPacket
      // Otherwise, ignore the packet
      if (this.state === null && ![PacketOpcode.GAME_START, PacketOpcode.GAME_RECOVERY].includes(packet.opcode)) {
        console.error(`Invalid packet received for player: ${PACKET_NAME[packet.opcode]}`);
        return;
      }
 
      if (packet.opcode === PacketOpcode.GAME_START) {
        const gameStart = packet.content as GameStartSchema;
        this.state = new GameState(gameStart.level, gameStart.current, gameStart.next, 3);

      } else if (packet.opcode === PacketOpcode.GAME_RECOVERY) {
        const gameRecovery = packet.content as GameRecoverySchema;
        if (this.state === null) this.state = GameState.fromRecovery(gameRecovery);
        else this.state.onRecovery(gameRecovery);

      } else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
        const placement = (packet.content as GamePlacementSchema);
        const activePiece = MoveableTetromino.fromMTPose(this.state!.getCurrentType(), placement.mtPose);
        this.state!.onPlacement(activePiece.getMTPose(), placement.nextNextType);

      } else if (packet.opcode === PacketOpcode.GAME_COUNTDOWN) {
        this.state!.setCountdown((packet.content as GameCountdownSchema).countdown);

      } else if (packet.opcode === PacketOpcode.GAME_FULL_BOARD) {
        const board = (packet.content as GameFullBoardSchema).board;
        this.state!.onFullBoardUpdate(board);

      } else if (packet.opcode === PacketOpcode.GAME_ABBR_BOARD) {
        const mtPose = (packet.content as GameAbbrBoardSchema).mtPose;
        this.state!.onAbbreviatedBoardUpdate(mtPose);

      } else if (packet.opcode === PacketOpcode.GAME_END) {
        this.previousSnapshot = this.state!.getSnapshot();
        this.state = null;

      } else {
        console.error(`Invalid packet received for player: ${PACKET_NAME[packet.opcode]}`);
      }

      // Update the snapshot
      this.snapshot$.next(this.state?.getSnapshot() ?? this.previousSnapshot ?? this.getDefaultSnapshot());
    }
  
    /**
     * Called when a packet is received from the server. Adds the packet to the PacketReplayer queue.
     * @param packet The packet received from the server
     */
    public onReceivePacket(packet: PacketContent) {
  
      // add the packet to the PacketReplayer queue, to be executed when the PacketReplayer decides
      this.replayer.ingestPacket(packet);
  
    }

    /**
     * Resets the game state of the player to the default state.
     */
    public resetSnapshot() {
      this.snapshot$.next(this.getDefaultSnapshot());
    }
  
    /**
     * @returns An observable of the current game state of the player
     */
    public getSnapshot$(): Observable<GameStateSnapshot> {
      return this.snapshot$.asObservable();
    }

    private getDefaultSnapshot(): GameStateSnapshot {
      return { 
        level: this.defaultLevel,
        lines: 0,
        score: 0,
        board: new TetrisBoard(),
        next: TetrominoType.ERROR_TYPE,
        countdown: 0,
        tetrisRate: 0,
        transitionInto19: null,
        transitionInto29: null,
        perfectInto19: false,
        perfectInto29: false,
      }
    };
}