import { Component, EventEmitter, Output } from '@angular/core';
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


  exit() {
    this.router.navigate(['/']);
  }
}
