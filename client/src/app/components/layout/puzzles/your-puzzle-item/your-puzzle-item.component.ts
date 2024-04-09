import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BinaryDecoder } from 'network-protocol/binary-codec';
import { BinaryTranscoder } from 'network-protocol/tetris-board-transcoding/binary-transcoder';
import { TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { BehaviorSubject } from 'rxjs';
import { SerializedPuzzle } from 'server/puzzles/decode-puzzle';

@Component({
  selector: 'app-your-puzzle-item',
  templateUrl: './your-puzzle-item.component.html',
  styleUrls: ['./your-puzzle-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourPuzzleItemComponent implements OnInit {

  @Input() puzzle!: SerializedPuzzle;

  public board!: TetrisBoard;

  ngOnInit(): void {

    // convert the board from binary representatino to TetrisBoard object
    this.board = BinaryTranscoder.decode(this.puzzle.board);
      
  }

}
