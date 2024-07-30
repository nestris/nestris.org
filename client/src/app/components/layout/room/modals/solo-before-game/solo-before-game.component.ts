import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { Router } from '@angular/router';
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
      this.clickPlay.emit(18);
    }
  }


  exit() {
    this.router.navigate(['/']);
  }
}
