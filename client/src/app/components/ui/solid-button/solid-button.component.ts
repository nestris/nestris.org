import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export enum ButtonColor {
  GREEN = "#54A165",
  RED = "#B73C3C",
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
  @Input() color: string | ButtonColor = ButtonColor.BLUE;
  @Input() disabled: boolean = false;
  @Input() stretch: boolean = false; // stretch to fit parent width
  @Input() fontSize: number = 16;
  @Input() fontWeight: number = 600;
  @Input() loading: boolean = false;
  @Input() paddingHorizontal: number = 15;
  @Input() paddingVertical: number = 6;
  @Input() borderRadius: number = 10;
  @Input() disableHover: boolean = false;
  @Input() iconHeight?: number;
  @Input() noShadow: boolean = false;

  @HostBinding('class.stretchHost') get stretchHost() { return this.stretch; }
}
