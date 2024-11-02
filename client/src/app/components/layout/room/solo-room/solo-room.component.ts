import { Component, HostListener } from '@angular/core';
import { GameOverMode } from 'src/app/components/nes-layout/nes-board/nes-board.component';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { RoomService } from 'src/app/services/room/room.service';
import { SoloClientRoom, SoloClientState } from 'src/app/services/room/solo-client-room';
import { SoloGamesListService } from 'src/app/services/state/solo-games-list.service';
import { DBSoloGamesList } from 'src/app/shared/room/solo-room-models';

@Component({
  selector: 'app-solo-room',
  templateUrl: './solo-room.component.html',
  styleUrls: ['./solo-room.component.scss']
})
export class SoloRoomComponent {

  public soloClientRoom = this.roomService.getClient<SoloClientRoom>();
  public soloGamesList$ = this.soloGamesListService.get$();

  readonly SoloClientState = SoloClientState;
  readonly GameOverMode = GameOverMode;


  constructor(
    public readonly platform: PlatformInterfaceService,
    public readonly emulator: EmulatorService,
    private readonly roomService: RoomService,
    private readonly soloGamesListService: SoloGamesListService
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

  soloGameHash(index: number, game: { id: string, score: number; xp: number }) {
    return game.id;
  }

  padScore(score: number): string {
    return score.toString().padStart(6, '0');
  }

  hasSevenDigits(games: DBSoloGamesList | null): boolean {

    if (!games) return false;

    return games.games.some(game => game.score > 999999);
  }

}


