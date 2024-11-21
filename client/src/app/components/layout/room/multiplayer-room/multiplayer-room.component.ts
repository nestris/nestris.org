import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { MultiplayerClientRoom } from 'src/app/services/room/multiplayer-client-room';
import { RoomService } from 'src/app/services/room/room.service';
import { calculateScoreForPlayer, MultiplayerRoomState, PlayerIndex } from 'src/app/shared/room/multiplayer-room-models';

@Component({
  selector: 'app-multiplayer-room',
  templateUrl: './multiplayer-room.component.html',
  styleUrls: ['./multiplayer-room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiplayerRoomComponent {

  public multiplayerClientRoom = this.roomService.getClient<MultiplayerClientRoom>();
  public multiplayerState$ = this.multiplayerClientRoom.getState$<MultiplayerRoomState>();

  readonly PLAYER_INDICIES = [PlayerIndex.PLAYER_1, PlayerIndex.PLAYER_2];



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

  /**
   * Check if the client is the player with the given index
   * @param index True if the client is the player with the given index, or false if the client is the other player or a spectator
   * @returns 
   */
  isMyIndex(index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): boolean {
    return this.multiplayerClientRoom.getMyIndex() === index;
  }

  /**
   * Blue is always on the left and red is always on the right. PLAYER_1 is on the left and PLAYER_2 is on the right,
   * except when the client is PLAYER_2, in which case the colors are reversed.
   * @param index 
   * @returns 
   */
  getIndexColor(index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): 'red' | 'blue' {
    if (this.multiplayerClientRoom.getMyIndex() === PlayerIndex.PLAYER_2) {
      return index === PlayerIndex.PLAYER_1 ? 'red' : 'blue';
    }
    else return index === PlayerIndex.PLAYER_1 ? 'blue' : 'red';
  }

  /**
   * Get the left-to-right order of the players in the room
   */
  getPlayerIndices(): (PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2)[] {
    if (this.multiplayerClientRoom.getMyIndex() === PlayerIndex.PLAYER_2) {
      return [PlayerIndex.PLAYER_2, PlayerIndex.PLAYER_1];
    } else {
      return [PlayerIndex.PLAYER_1, PlayerIndex.PLAYER_2];
    }
  }

  getScore(state: MultiplayerRoomState, index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2) {
    return calculateScoreForPlayer(state.points, index);
  }
}
