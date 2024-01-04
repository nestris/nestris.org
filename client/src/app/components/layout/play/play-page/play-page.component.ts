import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { Tetromino } from 'client/src/app/models/tetris/tetrominos';
import MoveableTetromino from 'client/src/app/models/tetris/moveable-tetromino';
import { ALL_TETROMINO_TYPES } from 'client/src/app/models/tetris/tetromino-type';

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

  constructor() {

    // testing tetromino shapes 
    ALL_TETROMINO_TYPES.forEach((type) => {
      const tetromino = Tetromino.getPieceByType(type);
      for (let rot = 0; rot < tetromino.numPossibleRotations(); rot++) {
        const mt = new MoveableTetromino(type, rot, 0, 0);
        mt.print();
      }
    });
  }

  // called when a platform option is clicked. set that platform to active
  selectPlatform(platform: Platform) {
    this.platform = platform;
  }

  playSolo() {

  }

  playVersus() {

  }

  playSandbox() {
    
  }

}
