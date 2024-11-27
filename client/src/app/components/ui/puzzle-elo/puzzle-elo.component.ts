import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-puzzle-elo',
  templateUrl: './puzzle-elo.component.html',
  styleUrls: ['./puzzle-elo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzleEloComponent {
  @Input() puzzleElo!: number;
  @Input() size!: number;
}
