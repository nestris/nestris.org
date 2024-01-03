import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export enum ButtonColor {
  GREEN = "#54A165",
  RED = "#A15454"
}

@Component({
  selector: 'app-solid-button',
  templateUrl: './solid-button.component.html',
  styleUrls: ['./solid-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolidButtonComponent {
  @Input() icon?: string;
  @Input() label!: string;
  @Input() color!: string | ButtonColor;
}
