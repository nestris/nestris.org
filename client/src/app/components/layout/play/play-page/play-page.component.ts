import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { Tetromino } from 'network-protocol/tetris/tetrominos';
import MoveableTetromino from 'network-protocol/tetris/moveable-tetromino';
import { ALL_TETROMINO_TYPES } from 'network-protocol/tetris/tetromino-type';
import { Platform, PlatformInterfaceService } from 'client/src/app/services/platform-interface.service';
import { TabID } from 'client/src/app/models/tabs';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-play-page',
  templateUrl: './play-page.component.html',
  styleUrls: ['./play-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPageComponent {

  readonly ButtonColor = ButtonColor;
  readonly Platform = Platform;
  
  constructor(
    public platformService: PlatformInterfaceService,
    private modalManager: ModalManagerService,
    private router: Router
  ) {

  }

  setupCalibration() {
    this.modalManager.showModal(ModalType.CALIBRATE_OCR);
  }

  playSolo() {
    this.router.navigate(['/online/solo'], { queryParams: { exit: encodeURIComponent("/play") } });
  }

}
