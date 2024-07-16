import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignOutComponent {

  constructor(
    private websocketService: WebsocketService,
  ) {}

  click() {
    this.websocketService.disconnect();
  }

}
