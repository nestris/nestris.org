import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { MultiplayerClientRoom } from 'src/app/services/room/multiplayer-client-room';
import { RoomService } from 'src/app/services/room/room.service';

@Component({
  selector: 'app-multiplayer-room',
  templateUrl: './multiplayer-room.component.html',
  styleUrls: ['./multiplayer-room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiplayerRoomComponent {

  public multiplayerClientRoom = this.roomService.getClient<MultiplayerClientRoom>();
;

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

}
