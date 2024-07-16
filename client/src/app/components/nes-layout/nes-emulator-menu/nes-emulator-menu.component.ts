import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'app-nes-emulator-menu',
  templateUrl: './nes-emulator-menu.component.html',
  styleUrls: ['./nes-emulator-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NesEmulatorMenuComponent {

  // two-way binding for the selected level
  @Input() selectedLevel: number = 9;
  @Output() selectedLevelChange = new EventEmitter<number>();

  // two-way binding for pause toggle button
  @Input() isPaused: boolean = false;
  @Output() togglePause = new EventEmitter<void>();

  // event for when RESET button is clicked
  @Output() reset = new EventEmitter<void>();

  // playable levels, each mapped to a button
  readonly LEVELS = [5, 9, 12, 15, 18, 19, 29];

  constructor() {
    console.log("nes emulator constructor");
  }
  

}
