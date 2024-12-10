import { MultiplayerClientRoom } from "src/app/services/room/multiplayer-client-room";
import { RoomService } from "src/app/services/room/room.service";
import { MultiplayerRoomState, PlayerIndex } from "src/app/shared/room/multiplayer-room-models";

export class MultiplayerComponent {

  public multiplayerClientRoom = this.roomService.getOldClient<MultiplayerClientRoom>();
  public multiplayerState$ = this.multiplayerClientRoom.getState$<MultiplayerRoomState>();

  readonly PLAYER_INDICIES = [PlayerIndex.PLAYER_1, PlayerIndex.PLAYER_2];

  constructor(
    protected readonly roomService: RoomService,
  ) {}

  /**
   * Check if the client is the player with the given index
   * @param index True if the client is the player with the given index, or false if the client is the other player or a spectator
   * @returns 
   */
  public isMyIndex(index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): boolean {
    return this.multiplayerClientRoom.getMyIndex() === index;
  }

  /**
   * Blue is always on the left and red is always on the right. PLAYER_1 is on the left and PLAYER_2 is on the right,
   * except when the client is PLAYER_2, in which case the colors are reversed.
   * @param index 
   * @returns 
   */
  public getIndexColor(index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): 'red' | 'blue' {
    if (this.multiplayerClientRoom.getMyIndex() === PlayerIndex.PLAYER_2) {
      return index === PlayerIndex.PLAYER_1 ? 'red' : 'blue';
    }
    else return index === PlayerIndex.PLAYER_1 ? 'blue' : 'red';
  }

  public getIndexColorWithTie(index: PlayerIndex): 'red' | 'blue' | 'tie' {
    if (index === PlayerIndex.DRAW) return 'tie';
    return this.getIndexColor(index);
  }


  public getColorIndex(color: 'red' | 'blue'): PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2 {
    if (this.multiplayerClientRoom.getMyIndex() === PlayerIndex.PLAYER_2) {
      return color === 'red' ? PlayerIndex.PLAYER_1 : PlayerIndex.PLAYER_2;
    }
    else return color === 'red' ? PlayerIndex.PLAYER_2 : PlayerIndex.PLAYER_1;
  }

  /**
   * Get the left-to-right order of the players in the room
   */
  public getPlayerIndices(): (PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2)[] {
    if (this.multiplayerClientRoom.getMyIndex() === PlayerIndex.PLAYER_2) {
      return [PlayerIndex.PLAYER_2, PlayerIndex.PLAYER_1];
    } else {
      return [PlayerIndex.PLAYER_1, PlayerIndex.PLAYER_2];
    }
  }

}