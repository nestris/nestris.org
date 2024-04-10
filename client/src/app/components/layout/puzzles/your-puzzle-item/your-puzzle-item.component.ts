import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BinaryDecoder } from 'network-protocol/binary-codec';
import { BinaryTranscoder } from 'network-protocol/tetris-board-transcoding/binary-transcoder';
import { TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { BehaviorSubject } from 'rxjs';
import { SerializedPuzzle } from 'server/puzzles/decode-puzzle';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PuzzleMode } from '../../play-puzzle/play-puzzle-page/play-puzzle-page.component';

@Component({
  selector: 'app-your-puzzle-item',
  templateUrl: './your-puzzle-item.component.html',
  styleUrls: ['./your-puzzle-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourPuzzleItemComponent implements OnInit {

  @Input() puzzle!: SerializedPuzzle;

  public board!: TetrisBoard;

  readonly ButtonColor = ButtonColor;

  constructor(
    private router: Router,
  ) {}

  ngOnInit(): void {

    // convert the board from binary representatino to TetrisBoard object
    this.board = BinaryTranscoder.decode(this.puzzle.board);
  }

  // navigate to a single-puzzle puzzle with the id of this puzzle item
  // encode the exit url to redirect back to current url
  play() {

    this.router.navigate([`/online/puzzle`], {
      queryParams: {
        mode: PuzzleMode.SINGLE,
        id: this.puzzle.id,
        exit: encodeURIComponent(this.router.url)
      },
    });
  }

}
