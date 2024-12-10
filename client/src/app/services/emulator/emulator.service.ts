import { Injectable } from '@angular/core';
import { GameStartPacket, GameCountdownPacket, GamePlacementPacket, GameAbbrBoardPacket, GameFullBoardPacket, GameEndPacket } from 'src/app/shared/network/stream-packets/packet';
import { TimeDelta } from 'src/app/util/time-delta';
import { PlatformInterfaceService, Platform } from '../platform-interface.service';
import { KeyManager } from './currently-pressed-keys';
import { EmulatorGameState, EMULATOR_FPS } from './emulator-game-state';
import { Keybinds } from './keybinds';
import { GameDisplayData } from 'src/app/shared/tetris/game-display-data';
import { GymRNG } from 'src/app/shared/tetris/piece-sequence-generation/gym-rng';
import { BinaryEncoder } from 'src/app/shared/network/binary-codec';
import { first, Observable, Subject } from 'rxjs';
import { eventIsForInput } from 'src/app/util/misc';
import { MemoryGameStatus, StatusHistory, StatusSnapshot } from 'src/app/shared/tetris/memory-game-status';
import { getFeedback } from 'src/app/util/game-feedback';
import { MeService } from '../state/me.service';
import { StackrabbitService } from '../stackrabbit/stackrabbit.service';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { LiveGameAnalyzer } from '../stackrabbit/live-game-analyzer';


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

  private framesDone: number = 0;
  private epoch: number = performance.now();

  private loop: any;

  // used for calculating time elapsed between frames
  private timeDelta = new TimeDelta();

  private sendPacketsToServer: boolean = false;

  private onTopout$ = new Subject<void>();

  private lastGameStatus: MemoryGameStatus | null = null;
  private lastGameFeedback: string | null = null;

  constructor(
    private platform: PlatformInterfaceService,
    private meService: MeService,
    private stackrabbitService: StackrabbitService,
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
    if (frameAmount >= 1) this.updateClientsideDisplay();

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

    // start game loop
    this.loop = setInterval(() => this.tick(), 0);
  }

  private updateClientsideDisplay() {

    const RUNAHEAD_FRAMES = 0;

    let state = this.currentState;
    if (!state) return;

    if (RUNAHEAD_FRAMES > 0) {
      // runahead to get next state
      let runaheadState = state.copy();
      for (let i = 0; i < RUNAHEAD_FRAMES; i++) {
        runaheadState.executeFrame(this.keyManager.peek());
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
      trt: state.getTetrisRate(),
      countdown: state.getCountdown(),
    };
    this.platform.updateGameData(data);

  }

  // run emulator for one tick
  // if keyboard input, rollback and runahead
  // if topped out, stop game
  private advanceEmulatorState() {
    
    const pressedKeys = this.keyManager.generate();

    if (!this.currentState) return;

    // Store previous data for comparison
    const previousBoard = this.currentState.getDisplayBoard();
    const previousCountdown = this.currentState.getCountdown();

    const oldActivePiece = this.currentState.getActivePiece();

    // execute frame
    this.currentState.executeFrame(pressedKeys);
    const newBoard = this.currentState.getDisplayBoard();
    const activePiece = this.currentState.getActivePiece();

    // send countdown packet if countdown has changed
    const currentCountdown = this.currentState.getCountdown();
    if (currentCountdown !== previousCountdown) {
      this.sendPacket(new GameCountdownPacket().toBinaryEncoder({
        delta: this.timeDelta.getDelta(),
        countdown: currentCountdown ?? 0,
      }));
    }

    // send placement packet if piece has been placed
    if (oldActivePiece && !activePiece) {
      this.sendPacket(new GamePlacementPacket().toBinaryEncoder({
        delta: this.timeDelta.getDelta(),
        nextNextType: this.currentState.getNextNextPieceType(),
        mtPose: oldActivePiece.getMTPose(),
        pushdown: this.currentState.getPushdownPoints(),
      }));

      this.analyzer!.onPlacement(oldActivePiece);
    }

    // send new position to analyzer if new piece has spawned
    if (!oldActivePiece && activePiece) {
      this.analyzer!.onNewPosition({
        board: this.currentState.getIsolatedBoard().copy(),
        currentPiece: this.currentState.getCurrentPieceType(),
        nextPiece: this.currentState.getNextPieceType(),
        level: this.currentState.getStatus().level,
        lines: this.currentState.getStatus().lines,
      });
    }

    // send packet with board info if board has changed
    if (!previousBoard.equals(newBoard)) {

      const activePiece = this.currentState.getActivePiece();

      if (activePiece) {
        // if there's an active piece, send abbreviated packet to save bandwidth
        this.sendPacket(new GameAbbrBoardPacket().toBinaryEncoder({
          delta: this.timeDelta.getDelta(),
          mtPose: activePiece.getMTPose(),
        }));

      } else {
        // send full state, since there is no active piece to send abbreviated packet info
        this.sendPacket(new GameFullBoardPacket().toBinaryEncoder({
          delta: this.timeDelta.getDelta(),
          board: newBoard,
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
    const overallAccuracy = this.analyzer!.getOverallAccuracy();
    console.log("Overall accuracy:", overallAccuracy);
    

    // Reset game state
    this.currentState = undefined;
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
}
