import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-trophies',
  templateUrl: './trophies.component.html',
  styleUrls: ['./trophies.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrophiesComponent {
  @Input() trophies: number | string = 0;
  @Input() size: number = 16;
  @Input() color?: string; // If color is not specified, default to gold gradient
  @Input() reverse: boolean = false; // If reverse is true, text will be left of the trophy icon
  @Input() scaleIcon: number = 1; // Scale the trophy icon
  @Input() scaleGap: number = 1; // Gap between icon and text
  @Input() textWidth: number | string = 'auto'; // Width of the text container
}
