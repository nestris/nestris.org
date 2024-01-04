import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FullscreenMode, RoutingService } from 'client/src/app/services/routing.service';

@Component({
  selector: 'app-solo-page',
  templateUrl: './solo-page.component.html',
  styleUrls: ['./solo-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloPageComponent {

  constructor(
    private routingService: RoutingService
  ) {}

  exitFullscreen() {
    this.routingService.setFullscreenMode(FullscreenMode.DISABLED);
  }

}
