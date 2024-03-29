import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export enum ButtonColor {
  GREEN = "#3CB75E",
  RED = "#A15454",
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
  @Input() label!: string;
  @Input() color!: string | ButtonColor;
  @Input() disabled: boolean = false;
  @Input() stretch: boolean = false; // stretch to fit parent width

  @HostBinding('class.stretchHost') get stretchHost() { return this.stretch; }
}
