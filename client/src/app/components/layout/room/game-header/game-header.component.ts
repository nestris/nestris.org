import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-game-header',
  templateUrl: './game-header.component.html',
  styleUrls: ['./game-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameHeaderComponent {
  @Input() trophies: number = 0;
  @Input() username: string = '';
  @Input() score: number = 0;
  @Input() color: 'red' | 'blue' = 'red';
  @Input() rated: boolean = false;

}
