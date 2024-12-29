import { Injectable, NgZone } from '@angular/core';
import { GameStartPacket, GameCountdownPacket, GamePlacementPacket, GameAbbrBoardPacket, GameFullBoardPacket, GameEndPacket } from 'src/app/shared/network/stream-packets/packet';
import { TimeDelta } from 'src/app/util/time-delta';
import { PlatformInterfaceService, Platform } from '../platform-interface.service';
import { KeyManager } from './currently-pressed-keys';
import { EmulatorGameState, EMULATOR_FPS } from './emulator-game-state';
import { Keybind, Keybinds } from './keybinds';
import { GameDisplayData } from 'src/app/shared/tetris/game-display-data';
import { GymRNG } from 'src/app/shared/tetris/piece-sequence-generation/gym-rng';
import { BinaryEncoder } from 'src/app/shared/network/binary-codec';
import { BehaviorSubject, first, Observable, Subject } from 'rxjs';
import { eventIsForInput } from 'src/app/util/misc';
import { MemoryGameStatus, StatusHistory, StatusSnapshot } from 'src/app/shared/tetris/memory-game-status';
import { getFeedback } from 'src/app/util/game-feedback';
import { MeService } from '../state/me.service';
import { StackrabbitService } from '../stackrabbit/stackrabbit.service';
import { LiveGameAnalyzer, PlacementEvaluation } from '../stackrabbit/live-game-analyzer';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { GamepadService } from '../gamepad.service';
import { WakeLockService } from '../wake-lock.service';


/*
Emulates a NES game as a 60fps state machine with keyboard input
*/

@Injectable({
  providedIn: 'root'
})
export class EmulatorService {

  private keybinds = new Keybinds(); // probably should inject this instead
  private keyManager = new KeyManager();

  private currentState: EmulatorGameState | undefined = undefined;
  private analyzer: LiveGameAnalyzer | undefined = undefined;

  private displayBoard: TetrisBoard = new TetrisBoard();

  private framesDone: number = 0;
  private epoch: number = performance.now();

  private loop: any;

  // used for calculating time elapsed between frames
  private timeDelta = new TimeDelta();

  private sendPacketsToServer: boolean = false;

  private onTopout$ = new Subject<void>();

  private lastGameStatus: MemoryGameStatus | null = null;
  private lastGameFeedback: string | null = null;

  private runaheadFrames: number = 0;
  private currentPlacementEvaluation$ = new BehaviorSubject<PlacementEvaluation | null>(null);

  constructor(
    private platform: PlatformInterfaceService,
    private meService: MeService,
    private stackrabbitService: StackrabbitService,
    private gamepadService: GamepadService,
    private wakeLockService: WakeLockService,
) {}

  // tick function that advances the emulator state during the game loop
  private tick() {

    if (this.currentState === undefined) return;
    
    // calculate how many frames to advance based on time elapsed to maintain 60fps
    const diff = performance.now() - this.epoch;
    const frames = diff / 1000 * EMULATOR_FPS | 0;
    const frameAmount = frames - this.framesDone;

    // Advance as many frames as needed to catch up to current time
    for (let i = 0; i < frameAmount; i++) {
      this.advanceEmulatorState();
    }

    // update the client-side board and game stsate if there are frames to update
    if (frameAmount >= 1) {
      this.updateClientsideDisplay();
    }

    // If more than one frame was executed in a tick cycle, log the number of frames skipped
    if (frameAmount > 1) console.log("Skipped", frameAmount-1, "frames");

    // update the number of frames done for the next calculation of frames to advance
    this.framesDone = frames;
  }

  private sendPacket(packet: BinaryEncoder) {
    if (this.sendPacketsToServer) {
      this.platform.sendPacket(packet);
    }
  }

  // starting game will create a game object and execute game frames at 60fps
  // if slowmode, will execute games at 5ps instead
  startGame(startLevel: number, sendPacketsToServer: boolean, seed?: string) {
    this.sendPacketsToServer = sendPacketsToServer;

    if (this.sendPacketsToServer) this.wakeLockService.enableWakeLock();

    console.log("starting game at level", startLevel, "with seed", seed);

    // Record initial game start time for deterimining time elapsed between frames
    this.timeDelta.resetDelta();

    // set all keys to unpressed
    this.keyManager.resetAll();

    this.epoch = performance.now();
    this.framesDone = 0;

    // generate initial game state
    const gymSeed = seed ?? GymRNG.generateRandomSeed();
    this.currentState = new EmulatorGameState(startLevel, new GymRNG(gymSeed));
    this.analyzer = new LiveGameAnalyzer(this.stackrabbitService, sendPacketsToServer ? this.platform : null, startLevel);
    
    // subscribe to placement evaluation updates
    this.analyzer.onPlacementEvaluation((evaluation) => this.currentPlacementEvaluation$.next(evaluation));

    this.analyzer.onNewPosition({
      board: this.currentState.getIsolatedBoard().copy(),
      currentPiece: this.currentState.getCurrentPieceType(),
      nextPiece: this.currentState.getNextPieceType(),
      level: this.currentState.getStatus().level,
      lines: this.currentState.getStatus().lines,
    });

    // send game start packet
    const current = this.currentState.getCurrentPieceType();
    const next = this.currentState.getNextPieceType();
    this.sendPacket(new GameStartPacket().toBinaryEncoder({level: startLevel, current, next}));

    // send initial board state
    this.sendPacket(new GameAbbrBoardPacket().toBinaryEncoder({
      delta: this.timeDelta.getDelta(),
      mtPose: this.currentState.getActivePiece()!.getMTPose(),
    }));

    // Update runahead flag
    this.runaheadFrames = this.meService.getSync()?.enable_runahead ? 1 : 0;
    console.log("Runahead frames:", this.runaheadFrames);

    // Update keybinds
    const me = this.meService.getSync();
    let keybinds: {[keybind in Keybind] : string};
  
    if (me) {
      keybinds = {
        [Keybind.SHIFT_LEFT]: me.keybind_emu_move_left,
        [Keybind.SHIFT_RIGHT]: me.keybind_emu_move_right,
        [Keybind.ROTATE_LEFT]: me.keybind_emu_rot_left,
        [Keybind.ROTATE_RIGHT]: me.keybind_emu_rot_right,
        [Keybind.PUSHDOWN]: me.keybind_emu_down,
      };
    } else keybinds = {
      [Keybind.SHIFT_LEFT]: "ArrowLeft",
      [Keybind.SHIFT_RIGHT]: "ArrowRight",
      [Keybind.ROTATE_LEFT]: "z",
      [Keybind.ROTATE_RIGHT]: "x",
      [Keybind.PUSHDOWN]: "ArrowDown",
    };
    this.keybinds.configureKeybinds(keybinds);

    // start game loop
    // this.zone.runOutsideAngular(() => {
    //   this.loop = setInterval(() => this.tick(), 0);
    // });
    this.loop = setInterval(() => this.tick(), 0);
  }

  private updateClientsideDisplay() {

    const RUNAHEAD_FRAMES = this.runaheadFrames;

    let state = this.currentState;
    if (!state) return;

    if (RUNAHEAD_FRAMES > 0) {
      // runahead to get next state
      let runaheadState = state.copy();
      for (let i = 0; i < RUNAHEAD_FRAMES; i++) {
        runaheadState.executeFrame(KeyManager.ALL_KEYS_UNPRESSED);
      }
      state = runaheadState;
    }

    // update game data
    const data: GameDisplayData = {
      board: state.getDisplayBoard(),
      level: state.getStatus().level,
      score: state.getStatus().score,
      lines: state.getStatus().lines,
      nextPiece: state.getNextPieceType(),
      trt: this.currentState!.getTetrisRate(), // use non-runahead state for tetris rate because it is not correct with runahead
      countdown: state.getCountdown(),
    };
    this.platform.updateGameData(data);

    // console.log("update display");

  }

  // run emulator for one tick
  // if keyboard input, rollback and runahead
  // if topped out, stop game
  private advanceEmulatorState() {

    // Poll gamepad and update pressed gamepad keys
    const gamepadKeybinds = this.keybinds.geGamepadKeybinds();
    const gamepadPressed = this.gamepadService.getPressedButtons();
    for (let keybind of gamepadKeybinds) {
      this.keyManager.setPressed(keybind, gamepadPressed.includes(this.keybinds.getKeybind(keybind)));
    }
    
    const pressedKeys = this.keyManager.generate();

    if (!this.currentState) return;

    // console.log("frame");

    // Store previous data for comparison
    const previousBoard = this.displayBoard;
    const previousCountdown = this.currentState.getCountdown();

    const wasPieceLocked = this.currentState.isPieceLocked();

    // execute frame
    this.currentState.executeFrame(pressedKeys);

    //console.log("frame new display board", this.currentState.getDisplayBoard() === this.displayBoard);
    this.displayBoard = this.currentState.getDisplayBoard();
    const activePiece = this.currentState.getActivePiece();
    const isPieceLocked = this.currentState.isPieceLocked();

    // send countdown packet if countdown has changed
    const currentCountdown = this.currentState.getCountdown();
    if (currentCountdown !== previousCountdown) {
      this.sendPacket(new GameCountdownPacket().toBinaryEncoder({
        delta: this.timeDelta.getDelta(),
        countdown: currentCountdown ?? 0,
      }));
    }

    // send placement packet if piece has been placed
    if (!wasPieceLocked && isPieceLocked) {
      this.sendPacket(new GamePlacementPacket().toBinaryEncoder({
        nextNextType: this.currentState.getNextNextPieceType(),
        mtPose: activePiece.getMTPose(),
        pushdown: this.currentState.getPushdownPoints(),
      }));

      this.analyzer!.onPlacement(activePiece);
    }

    // send new position to analyzer if new piece has spawned
    if (wasPieceLocked && !isPieceLocked) {
      this.analyzer!.onNewPosition({
        board: this.currentState.getIsolatedBoard().copy(),
        currentPiece: this.currentState.getCurrentPieceType(),
        nextPiece: this.currentState.getNextPieceType(),
        level: this.currentState.getStatus().level,
        lines: this.currentState.getStatus().lines,
      });
    }

    // send packet with board info if board has changed
    if (!previousBoard.equals(this.displayBoard)) {

      if (!isPieceLocked) {
        // if there's an active piece, send abbreviated packet to save bandwidth
        this.sendPacket(new GameAbbrBoardPacket().toBinaryEncoder({
          delta: this.timeDelta.getDelta(),
          mtPose: activePiece.getMTPose(),
        }));

      } else {
        // send full state, since there is no active piece to send abbreviated packet info
        this.sendPacket(new GameFullBoardPacket().toBinaryEncoder({
          delta: this.timeDelta.getDelta(),
          board: this.displayBoard,
        }));
      }

    }
    
    // if topped out, stop game
    if (this.currentState.isToppedOut()) {
      this.stopGame();
      this.onTopout$.next();
    }

  }


  stopGame(force: boolean = false) {

    // if game is already stopped, do nothing
    if (this.currentState === undefined) return;

    this.wakeLockService.disableWakeLock();

    // stop game loop
    console.log("game stopped");
    clearInterval(this.loop);
    this.loop = undefined;

    // Set last game snapshots
    const highestLines = this.meService.getSync()?.highest_lines;
    if (this.sendPacketsToServer && highestLines != undefined && !force) {
      this.lastGameStatus = this.currentState.getStatus();
      this.lastGameFeedback = getFeedback(this.currentState.getStatus(), highestLines);
    }

    this.analyzer!.stopAnalysis();
    this.currentPlacementEvaluation$.next(null);
    const overallAccuracy = this.analyzer!.getOverallAccuracy();
    console.log("Overall accuracy:", overallAccuracy);
    

    // Reset game state
    this.currentState = undefined;
    this.analyzer!.destroy();
    this.analyzer = undefined;
    
    // send game end packet
    if (!force) this.sendPacket(new GameEndPacket().toBinaryEncoder({}));
  }

  // if matching keybind, update currently pressed keys on keydown
  handleKeydown(event: KeyboardEvent) {

    if (eventIsForInput(event)) return;

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onPress(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
  }

  // if matching keybind, update currently pressed keys on keyup
  handleKeyup(event: KeyboardEvent) {

    if (eventIsForInput(event)) return;

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onRelease(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onTopout(): Observable<void> {
    return this.onTopout$.asObservable();
  }

  getLastGameStatus(): MemoryGameStatus | null {
    return this.lastGameStatus;
  }

  getLastGameFeedback(): string | null {
    return this.lastGameFeedback;
  }

  getCurrentPlacementEvaluation$(): Observable<PlacementEvaluation | null> {
    return this.currentPlacementEvaluation$.asObservable();
  }

  
}
