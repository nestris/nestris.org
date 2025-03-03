import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { GameOverMode } from 'src/app/components/nes-layout/nes-board/nes-board.component';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { RoomService } from 'src/app/services/room/room.service';
import { calculateScoreForPlayer, MultiplayerRoomState, MultiplayerRoomStatus, PlayerIndex } from 'src/app/shared/room/multiplayer-room-models';
import { MultiplayerComponent } from './multiplayer-component';
import { Platform } from 'src/app/shared/models/platform';
import { OCRStatus } from 'src/app/services/room/multiplayer-client-room';

@Component({
  selector: 'app-multiplayer-room',
  templateUrl: './multiplayer-room.component.html',
  styleUrls: ['./multiplayer-room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiplayerRoomComponent extends MultiplayerComponent {

  readonly MultiplayerRoomStatus = MultiplayerRoomStatus;
  readonly Platform = Platform;
  readonly OCRStatus = OCRStatus;

  public ocrStatus$ = this.multiplayerClientRoom.getOCRStatus$();

  constructor(
    public readonly platform: PlatformInterfaceService,
    public readonly emulator: EmulatorService,
    roomService: RoomService,
  ) {
    super(roomService);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    this.emulator.handleKeydown(event);
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent) {
    this.emulator.handleKeyup(event);
  }

  getScore(state: MultiplayerRoomState, index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2) {
    return calculateScoreForPlayer(state.points, index);
  }

  showBoardText(state: MultiplayerRoomState, index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2, ocrStatus: OCRStatus | null = null): string | undefined {
    if (state.players[index].leftRoom && state.status === MultiplayerRoomStatus.IN_GAME) return "RESIGNED";
    if (state.status === MultiplayerRoomStatus.BEFORE_GAME) {
      if (state.ready[index]) return 'READY';
      if (!this.isMyIndex(index) && state.lastGameWinner === null) return 'NOT READY';
    }

    if (state.status === MultiplayerRoomStatus.IN_GAME && ocrStatus === OCRStatus.OCR_BEFORE_GAME) return "Detecting game...";
    
    return undefined;
  }

  getGameOverMode(state: MultiplayerRoomState, index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): GameOverMode | undefined {

    if (this.multiplayerClientRoom.showingAfterMatchModal()) return undefined;

    if (state.status === MultiplayerRoomStatus.BEFORE_GAME) {

      // if before first game, show ready
      if (state.lastGameWinner === null) {
        if (this.isMyIndex(index)) return state.ready[index] ? undefined : GameOverMode.READY;
        return undefined;

      } else if (state.ready[index]) { // If player is ready after a game, do not show game over mode
        return undefined;

      } else { // If not ready after a game, show win/lose/tie

        if (state.lastGameWinner === index) return GameOverMode.WIN;
        if (state.lastGameWinner === PlayerIndex.DRAW) return GameOverMode.TIE;
        return GameOverMode.LOSE;
      }
    }

    else if (state.status === MultiplayerRoomStatus.AFTER_MATCH) {
      if (state.matchWinner === index) return GameOverMode.WIN;
      if (state.matchWinner === PlayerIndex.DRAW) return GameOverMode.TIE;
      return GameOverMode.LOSE;
    }

    return undefined;
  }

  clickNext(state: MultiplayerRoomState) {
    if (state.status === MultiplayerRoomStatus.BEFORE_GAME) {
      console.log('Ready for next game');
      this.multiplayerClientRoom.sendReadyEvent();
    } else if (state.status === MultiplayerRoomStatus.AFTER_MATCH) {
      this.multiplayerClientRoom.showAfterMatchModal();
    }
  }

}
