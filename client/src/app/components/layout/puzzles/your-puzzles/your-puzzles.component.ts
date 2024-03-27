import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';

@Component({
  selector: 'app-your-puzzles',
  templateUrl: './your-puzzles.component.html',
  styleUrls: ['./your-puzzles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourPuzzlesComponent {

  readonly ButtonColor = ButtonColor;

}
