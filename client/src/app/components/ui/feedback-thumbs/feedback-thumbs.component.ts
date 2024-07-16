import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { WebsocketService } from 'src/app/services/websocket.service';
import { PuzzleFeedback } from 'src/app/shared/puzzles/puzzle-feedback';

@Component({
  selector: 'app-feedback-thumbs',
  templateUrl: './feedback-thumbs.component.html',
  styleUrls: ['./feedback-thumbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedbackThumbsComponent {
  @Input() puzzleID!: string;

  public feedback$ = new BehaviorSubject<PuzzleFeedback>(PuzzleFeedback.NONE);

  readonly PuzzleFeedback = PuzzleFeedback;

  constructor(
    private websocketService: WebsocketService,
  ) {}

  async setFeedback(feedback: PuzzleFeedback) {

    const username = this.websocketService.getUsername();

    if (!username) {
      console.error("No username found");
      return;
    }

    const body = {
      id: this.puzzleID,
      username: username,
      feedback: feedback,
    };

    const response = await fetchServer2(Method.POST, `/api/v2/set-feedback`, body);
    console.log("Feedback response:", response);

    this.feedback$.next(feedback);
  }

}
