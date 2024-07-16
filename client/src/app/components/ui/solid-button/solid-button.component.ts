import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export enum ButtonColor {
  GREEN = "#54A165",
  RED = "#ca4d4d",
  BLUE = "#3C5EB7",
  GREY = "#2F3033"
}

@Component({
  selector: 'app-solid-button',
  templateUrl: './solid-button.component.html',
  styleUrls: ['./solid-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolidButtonComponent {
  @Input() icon?: string;
  @Input() label?: string;
  @Input() color!: string | ButtonColor;
  @Input() disabled: boolean = false;
  @Input() stretch: boolean = false; // stretch to fit parent width
  @Input() fontSize: number = 16;
  @Input() fontWeight: number = 600;
  @Input() loading: boolean = false;

  @HostBinding('class.stretchHost') get stretchHost() { return this.stretch; }
}
