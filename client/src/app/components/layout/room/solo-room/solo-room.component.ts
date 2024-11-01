import { Component, HostListener } from '@angular/core';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';

@Component({
  selector: 'app-solo-room',
  templateUrl: './solo-room.component.html',
  styleUrls: ['./solo-room.component.scss']
})
export class SoloRoomComponent {

  constructor(
    public readonly platform: PlatformInterfaceService,
    public readonly emulator: EmulatorService,
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


