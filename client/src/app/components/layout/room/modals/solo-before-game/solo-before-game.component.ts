import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';

@Component({
  selector: 'app-solo-before-game',
  templateUrl: './solo-before-game.component.html',
  styleUrls: ['./solo-before-game.component.scss']
})
export class SoloBeforeGameComponent {
  // Output is the start level
  @Output() clickPlay = new EventEmitter<number>();

  readonly ButtonColor = ButtonColor;

  readonly VALID_START_LEVELS = [0, 5, 9, 12, 15, 18, 19, 29]

  selectedLevel$ = new BehaviorSubject<number>(18);

  constructor(
    private readonly router: Router
  ) { }

  // Pressing "space" or "enter" should also trigger the next button
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      console.log('click solo before game');
      event.preventDefault();
      event.stopImmediatePropagation();
      this.clickPlay.emit(this.selectedLevel$.getValue());
    }
  }


  exit() {
    this.router.navigate(['/']);
  }
}
