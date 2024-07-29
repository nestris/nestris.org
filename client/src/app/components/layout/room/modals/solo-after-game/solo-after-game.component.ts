import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { SoloGameEndMessage } from 'src/app/shared/network/json-message';

@Component({
  selector: 'app-solo-after-game',
  templateUrl: './solo-after-game.component.html',
  styleUrls: ['./solo-after-game.component.scss']
})
export class SoloAfterGameComponent {
  @Input() game!: SoloGameEndMessage;
  @Output() clickNext = new EventEmitter<void>();

  readonly ButtonColor = ButtonColor;

  constructor(
    private readonly router: Router
  ) { }


  clickAnalyze() {

  }


  exit() {
    this.router.navigate(['/']);
  }
}
