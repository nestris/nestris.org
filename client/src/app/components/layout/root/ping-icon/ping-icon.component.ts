import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PingSpeed } from 'src/app/services/ping.service';

@Component({
  selector: 'app-ping-icon',
  templateUrl: './ping-icon.component.html',
  styleUrls: ['./ping-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PingIconComponent {
  @Input() speed: PingSpeed = PingSpeed.SLOW;

  readonly PingSpeed = PingSpeed;

}
