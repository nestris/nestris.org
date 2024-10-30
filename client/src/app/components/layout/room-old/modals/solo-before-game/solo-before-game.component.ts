import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';

@Component({
  selector: 'app-solo-before-game',
  templateUrl: './solo-before-game.component.html',
  styleUrls: ['./solo-before-game.component.scss']
})
export class SoloBeforeGameComponent {
  // Output is the start level
  @Output() clickPlay = new EventEmitter<number>();

  @Input() selectedLevel!: number;
  @Output() selectedLevelChange = new EventEmitter<number>();

  readonly ButtonColor = ButtonColor;
  readonly Platform = Platform;

  readonly VALID_START_LEVELS = [0, 5, 9, 12, 15, 18, 19, 29]

  //selectedLevel$ = new BehaviorSubject<number>(18);

  constructor(
    private readonly router: Router,
    public readonly platform: PlatformInterfaceService
  ) { }

  // Pressing "space" or "enter" should also trigger the next button
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      console.log('click solo before game');
      event.preventDefault();
      event.stopImmediatePropagation();
      this.clickPlay.emit(this.selectedLevel);
    }

    // Left/right/up/down arrow keys to change level
    if (event.key === 'ArrowLeft') {
      if (this.selectedLevel == 5) this.selectedLevelChange.emit(0);
      if (this.selectedLevel == 9) this.selectedLevelChange.emit(5);
      if (this.selectedLevel == 12) this.selectedLevelChange.emit(9);
      if (this.selectedLevel == 18) this.selectedLevelChange.emit(15);
      if (this.selectedLevel == 19) this.selectedLevelChange.emit(18);
      if (this.selectedLevel == 29) this.selectedLevelChange.emit(19);
    }
    if (event.key === 'ArrowRight') {
      if (this.selectedLevel == 0) this.selectedLevelChange.emit(5);
      if (this.selectedLevel == 5) this.selectedLevelChange.emit(9);
      if (this.selectedLevel == 9) this.selectedLevelChange.emit(12);
      if (this.selectedLevel == 15) this.selectedLevelChange.emit(18);
      if (this.selectedLevel == 18) this.selectedLevelChange.emit(19);
      if (this.selectedLevel == 19) this.selectedLevelChange.emit(29);
    }
    if (event.key === 'ArrowUp') {
      if (this.selectedLevel == 15) this.selectedLevelChange.emit(0);
      if (this.selectedLevel == 18) this.selectedLevelChange.emit(5);
      if (this.selectedLevel == 19) this.selectedLevelChange.emit(9);
      if (this.selectedLevel == 29) this.selectedLevelChange.emit(12);
    }
    if (event.key === 'ArrowDown') {
      if (this.selectedLevel == 0) this.selectedLevelChange.emit(15);
      if (this.selectedLevel == 5) this.selectedLevelChange.emit(18);
      if (this.selectedLevel == 9) this.selectedLevelChange.emit(19);
      if (this.selectedLevel == 12) this.selectedLevelChange.emit(29);
    }
  }


  exit() {
    this.router.navigate(['/']);
  }
}
