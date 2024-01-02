import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-solid-button',
  templateUrl: './solid-button.component.html',
  styleUrls: ['./solid-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolidButtonComponent {
  @Input() icon!: string;
  @Input() label!: string;
  @Input() color!: string;
}
