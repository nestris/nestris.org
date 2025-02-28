import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { map } from 'rxjs';
import { GameOverMode } from 'src/app/components/nes-layout/nes-board/nes-board.component';
import { getDisplayKeybind } from 'src/app/components/ui/editable-keybind/editable-keybind.component';
import { RatedMove } from 'src/app/components/ui/eval-bar/eval-bar.component';
import { QuestService } from 'src/app/services/quest.service';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { RoomService } from 'src/app/services/room/room.service';
import { SoloClientRoom, SoloClientState } from 'src/app/services/room/solo-client-room';
import { MeService } from 'src/app/services/state/me.service';
import { CATEGORY_REDIRECT, getQuest, QuestRedirect } from 'src/app/shared/nestris-org/quest-system';
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

  public showAnalysis: boolean = false;


  constructor(
    public readonly platform: PlatformInterfaceService,
    public readonly emulator: EmulatorService,
    private readonly roomService: RoomService,
    private readonly meService: MeService,
    private readonly activeQuestService: QuestService,
  ) {

    const activeQuestID = this.activeQuestService.activeQuestID$.getValue();
    const isAccuracyQuest = activeQuestID !== null && (CATEGORY_REDIRECT[getQuest(activeQuestID).category] === QuestRedirect.SOLO_ACCURACY);
    console.log("Active quest", activeQuestID ? getQuest(activeQuestID).name : 'none');
    console.log("is Accuracy quest", isAccuracyQuest);
    this.showAnalysis = this.meService.getSync()?.show_live_analysis || isAccuracyQuest;
  }

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

  getKeybinds(): string {
    const me = this.meService.getSync()!;

    const moveLeft = getDisplayKeybind(me.keybind_emu_move_left);
    const moveRight = getDisplayKeybind(me.keybind_emu_move_right);
    const rotLeft = getDisplayKeybind(me.keybind_emu_rot_left);
    const rotRight = getDisplayKeybind(me.keybind_emu_rot_right);
    return `Move: ${moveLeft} ${moveRight}, Rotate: ${rotLeft} ${rotRight}`;
  }

}


