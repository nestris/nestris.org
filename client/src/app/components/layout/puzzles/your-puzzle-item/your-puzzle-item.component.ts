import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { NotificationService } from 'src/app/services/notification.service';
import { BinaryTranscoder } from 'src/app/shared/network/tetris-board-transcoding/binary-transcoder';
import { PlayerPuzzle } from 'src/app/shared/puzzles/player-puzzle';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { PuzzleMode } from '../../play-puzzle/play-puzzle-page/play-puzzle-page.component';
import { copyPuzzleLink } from 'src/app/util/copy-url';


@Component({
  selector: 'app-your-puzzle-item',
  templateUrl: './your-puzzle-item.component.html',
  styleUrls: ['./your-puzzle-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourPuzzleItemComponent implements OnInit {

  @Input() puzzle!: PlayerPuzzle;
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
    this.board = BinaryTranscoder.decode(this.puzzle.boardString);
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
    copyPuzzleLink(this.notifier, this.puzzle.id);
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
