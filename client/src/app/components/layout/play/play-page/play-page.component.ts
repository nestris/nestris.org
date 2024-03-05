import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { Tetromino } from 'client/src/app/models/tetris/tetrominos';
import MoveableTetromino from 'client/src/app/models/tetris/moveable-tetromino';
import { ALL_TETROMINO_TYPES } from 'client/src/app/models/tetris/tetromino-type';
import { Platform, PlatformInterfaceService } from 'client/src/app/services/platform-interface.service';
import { TabID } from 'client/src/app/models/tabs';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';

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
    private modalManager: ModalManagerService
  ) {

  }

  setupCalibration() {
    this.modalManager.showModal(ModalType.CALIBRATE_OCR);
  }

}
