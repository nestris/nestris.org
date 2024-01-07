import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { ColorType, TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';
import { RoutingService } from 'client/src/app/services/routing.service';

@Component({
  selector: 'app-solo-page',
  templateUrl: './solo-page.component.html',
  styleUrls: ['./solo-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloPageComponent {

  public board: TetrisBoard;

  readonly TetrominoType = TetrominoType;

  constructor(
    private routingService: RoutingService
  ) {

    // test random board
    this.board = new TetrisBoard();
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const r = Math.random();
        if (r > 0.8) this.board.setAt(x,y, ColorType.WHITE);
        else if (r > 0.6) this.board.setAt(x,y, ColorType.PRIMARY);
        else if (r > 0.4) this.board.setAt(x,y, ColorType.SECONDARY);
      }
    }
  }

  exitFullscreen() {
    // go back to previous tab. if no previous tab, go to home
    const lastTab = this.routingService.getLastTab() ?? TabID.HOME;
    console.log("exitFullscreen", lastTab);
    this.routingService.setSelectedTab({tab: lastTab, params: undefined});
  }

}
