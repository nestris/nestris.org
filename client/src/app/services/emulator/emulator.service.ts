import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RandomRNG } from 'src/app/models/piece-sequence-generation/random-rng';
import { BinaryEncoder } from 'src/app/shared/network/binary-codec';
import { JsonMessageType } from 'src/app/shared/network/json-message';
import { GameStartPacket, GameCountdownPacket, GamePlacementPacket, GameAbbrBoardPacket, GameFullBoardPacket, GameEndPacket } from 'src/app/shared/network/stream-packets/packet';
import { FpsTracker } from 'src/app/shared/scripts/fps-tracker';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { TimeDelta } from 'src/app/util/time-delta';
import { PlatformInterfaceService, Platform } from '../platform-interface.service';
import { WebsocketService } from '../websocket.service';
import { KeyManager } from './currently-pressed-keys';
import { EmulatorGameState, EMULATOR_FPS } from './emulator-game-state';
import { Keybinds } from './keybinds';
import { GameDisplayData } from 'src/app/shared/tetris/game-display-data';


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

  private framesDone: number = 0;
  private epoch: number = performance.now();

  private loop: any;

  // used for calculating time elapsed between frames
  private timeDelta = new TimeDelta();

  constructor(
    private platform: PlatformInterfaceService,
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

    // update the number of frames done for the next calculation of frames to advance
    this.framesDone = frames;
  }

  // starting game will create a game object and execute game frames at 60fps
  // if slowmode, will execute games at 5ps instead
  startGame(level: number) {

    console.log("starting game at level", level);

    // Record initial game start time for deterimining time elapsed between frames
    this.timeDelta.resetDelta();

    // set all keys to unpressed
    this.keyManager.resetAll();

    this.epoch = performance.now();
    this.framesDone = 0;

    // generate initial game state
    this.currentState = new EmulatorGameState(level, new RandomRNG());

    // send game start packet
    const current = this.currentState.getCurrentPieceType();
    const next = this.currentState.getNextPieceType();
    this.platform.sendPacket(new GameStartPacket().toBinaryEncoder({level, current, next}));

    // start game loop
    this.loop = setInterval(() => this.tick(), 0);
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

    // execute frame
    const result = this.currentState.executeFrame(pressedKeys);
    const newBoard = this.currentState.getDisplayBoard();

    // update game data
    const data: GameDisplayData = {
      board: newBoard,
      level: this.currentState.getStatus().level,
      score: this.currentState.getStatus().score,
      lines: this.currentState.getStatus().lines,
      nextPiece: this.currentState.getNextPieceType(),
      countdown: this.currentState.getCountdown(),
    };
    this.platform.updateGameData(data);

    // send countdown packet if countdown has changed
    const currentCountdown = this.currentState.getCountdown();
    if (currentCountdown !== previousCountdown) {
      this.platform.sendPacket(new GameCountdownPacket().toBinaryEncoder({
        delta: this.timeDelta.getDelta(),
        countdown: currentCountdown ?? 0,
      }));
    }

    // send placement packet if piece has been placed
    if (result.newPieceSpawned && !result.toppedOut) {
      this.platform.sendPacket(new GamePlacementPacket().toBinaryEncoder({
        delta: this.timeDelta.getDelta(),
        nextNextType: this.currentState.getNextPieceType(),
        mtPose: result.lockedPiece!.getMTPose(),
        pushdown: 0 // TODO: calculate pushdown
      }));
    }

    // send packet with board info if board has changed
    if (!previousBoard.equals(newBoard)) {

      const activePiece = this.currentState.getActivePiece();

      if (activePiece) {
        // if there's an active piece, send abbreviated packet to save bandwidth
        this.platform.sendPacket(new GameAbbrBoardPacket().toBinaryEncoder({
          delta: this.timeDelta.getDelta(),
          mtPose: activePiece.getMTPose(),
        }));

      } else {
        // send full state, since there is no active piece to send abbreviated packet info
        this.platform.sendPacket(new GameFullBoardPacket().toBinaryEncoder({
          delta: this.timeDelta.getDelta(),
          board: newBoard,
        }));
      }

    }
    
    // if topped out, stop game
    if (this.currentState.isToppedOut()) this.stopGame();

  }

  stopGame() {

    // if game is already stopped, do nothing
    if (this.currentState === undefined) return;

    // stop game loop
    console.log("game stopped");
    clearInterval(this.loop);
    this.loop = undefined;

    // Reset game state
    this.currentState = undefined;
    
    // send game end packet
    this.platform.sendPacket(new GameEndPacket().toBinaryEncoder({}));
  }


  // if matching keybind, update currently pressed keys on keydown
  handleKeydown(event: KeyboardEvent) {

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onPress(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
  }

  // if matching keybind, update currently pressed keys on keyup
  handleKeyup(event: KeyboardEvent) {

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onRelease(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
  }
}
