import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WebsocketService } from 'client/src/app/services/websocket.service';

@Component({
  selector: 'app-ranked-puzzles',
  templateUrl: './ranked-puzzles.component.html',
  styleUrls: ['./ranked-puzzles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankedPuzzlesComponent {

  constructor(
    public websocket: WebsocketService
  ) {}

}
