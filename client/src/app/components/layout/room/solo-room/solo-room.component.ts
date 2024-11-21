import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { map } from 'rxjs';
import { GameOverMode } from 'src/app/components/nes-layout/nes-board/nes-board.component';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { RoomService } from 'src/app/services/room/room.service';
import { SoloClientRoom, SoloClientState } from 'src/app/services/room/solo-client-room';
import { SoloGameInfo, SoloRoomState } from 'src/app/shared/room/solo-room-models';

@Component({
  selector: 'app-solo-room',
  templateUrl: './solo-room.component.html',
  styleUrls: ['./solo-room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloRoomComponent {

  public soloClientRoom = this.roomService.getClient<SoloClientRoom>();
  public previousGames$ = this.soloClientRoom.getState$<SoloRoomState>().pipe(map(state => state.previousGames));

  readonly SoloClientState = SoloClientState;
  readonly GameOverMode = GameOverMode;


  constructor(
    public readonly platform: PlatformInterfaceService,
    public readonly emulator: EmulatorService,
    private readonly roomService: RoomService,
  ) {}

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    this.emulator.handleKeydown(event);
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent) {
    this.emulator.handleKeyup(event);
  }

  clickNextOnTopout() {
    this.soloClientRoom.setSoloState(SoloClientState.AFTER_GAME_MODAL);
  }

  soloGameHash(index: number, game: SoloGameInfo) {
    return game.gameID;
  }

  padScore(score: number): string {
    return score.toString().padStart(6, '0');
  }

  hasSevenDigits(games: SoloGameInfo[] | null): boolean {

    if (!games) return false;

    return games.some(game => game.score > 999999);
  }

}


