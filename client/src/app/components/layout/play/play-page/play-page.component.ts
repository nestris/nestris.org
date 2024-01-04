import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';

export enum Platform {
  ONLINE = "ONLINE",
  OCR = "OCR"
}

@Component({
  selector: 'app-play-page',
  templateUrl: './play-page.component.html',
  styleUrls: ['./play-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPageComponent {

  readonly Platform = Platform;
  readonly ButtonColor = ButtonColor;
  
  // default mode is online
  public platform = Platform.ONLINE;

  // called when a platform option is clicked. set that platform to active
  selectPlatform(platform: Platform) {
    this.platform = platform;
  }

}
