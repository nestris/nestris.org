import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export enum Mode {
  SOLO = 'solo',
  RANKED = 'ranked',
  PUZZLES = 'puzzles',
}

@Component({
  selector: 'app-mode-icon',
  templateUrl: './mode-icon.component.html',
  styleUrls: ['./mode-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModeIconComponent {
  @Input() mode!: Mode;
  @Input() width!: number;
}
