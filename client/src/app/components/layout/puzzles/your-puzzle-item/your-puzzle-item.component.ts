import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BinaryDecoder } from 'network-protocol/binary-codec';
import { BinaryTranscoder } from 'network-protocol/tetris-board-transcoding/binary-transcoder';
import { TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { BehaviorSubject } from 'rxjs';
import { SerializedPuzzle } from 'server/puzzles/decode-puzzle';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PuzzleMode } from '../../play-puzzle/play-puzzle-page/play-puzzle-page.component';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { reloadCurrentRoute } from 'misc/angular-functions';
import { NotificationService } from 'client/src/app/services/notification.service';
import { NotificationType } from 'network-protocol/models/notifications';

@Component({
  selector: 'app-your-puzzle-item',
  templateUrl: './your-puzzle-item.component.html',
  styleUrls: ['./your-puzzle-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourPuzzleItemComponent implements OnInit {

  @Input() puzzle!: SerializedPuzzle;
  @Output() delete = new EventEmitter<void>();

  public board!: TetrisBoard;

  readonly ButtonColor = ButtonColor;

  public deleting$ = new BehaviorSubject<boolean>(false);

  constructor(
    private router: Router,
    private notifier: NotificationService
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

  // copy url of the puzzle to clipboard
  copyPuzzleLink() {

    // generate the url of the puzzle
    const currentURL = new URL(window.location.href); // need to extract base url
    const puzzleURL = new URL(currentURL.origin + "/online/puzzle");
    puzzleURL.searchParams.set('mode', PuzzleMode.SINGLE);
    puzzleURL.searchParams.set('id', this.puzzle.id);

    // copy the url to clipboard
    navigator.clipboard.writeText(puzzleURL.toString());
    console.log("Copied puzzle link to clipboard", puzzleURL.toString());

    // notify the user that the link has been copied
    this.notifier.notify(NotificationType.SUCCESS, "Puzzle link copied to clipboard");
  }

  async deletePuzzle() {

    // delete the puzzle from the server
    this.deleting$.next(true);
    await fetchServer2(Method.DELETE, `/api/v2/puzzle/${this.puzzle.id}`);
    this.deleting$.next(false);

    // emit a delete event, which should remove this puzzle item from the list front-end side
    this.delete.emit();
  }

}
