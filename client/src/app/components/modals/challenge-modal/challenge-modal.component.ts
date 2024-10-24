import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ButtonColor } from '../../ui/solid-button/solid-button.component';
import { FriendsService } from 'src/app/services/friends.service';
import { ModalManagerService } from 'src/app/services/modal-manager.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Challenge } from 'src/app/shared/models/challenge';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';

export interface ChallengeModalConfig {
  opponentid: string;
  opponentUsername: string;
}

@Component({
  selector: 'app-challenge-modal',
  templateUrl: './challenge-modal.component.html',
  styleUrls: ['./challenge-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeModalComponent {
  @Input() config!: ChallengeModalConfig;

  readonly error$ = new BehaviorSubject<string | null>(null);

  readonly ButtonColor = ButtonColor;

  winningScore: number = 2;
  winningScoreTabs = [1, 2, 3];
  winningScoreStrings = {
    1: 'First to 1',
    2: 'First to 2',
    3: 'First to 3'
  }

  constructor(
    private fetchService: FetchService,
    private websocketService: WebsocketService,
    private modalService: ModalManagerService,
    private friendsService: FriendsService,
    private meService: MeService,
  ) {}

  async challenge() {

    const userID = await this.meService.getUserID();
    const username = await this.meService.getUsername();
    const sessionID = this.websocketService.getSessionID();
    if (!userID || !username || !sessionID) return; // if not logged in, do nothing

    // set challenge parameters
    const challenge: Challenge = {
      senderid: userID,
      senderUsername: username,
      senderSessionID: sessionID,
      receiverid: this.config.opponentid,
      receiverUsername: this.config.opponentUsername,
      startLevel: 18,
      rated: false,
      winningScore: this.winningScore,
      isRematch: false
    }

    // send challenge to server. if successful, close modal
    const { success, error } = await this.fetchService.fetch<{
      success: boolean, error?: string
    }>(Method.POST, '/api/v2/send-challenge', { challenge });

    if (success) {
      this.friendsService.syncWithServer();
      this.modalService.hideModal();
    } else {
      this.error$.next(error ?? "Unknown error occured. Please try again later.");
    }
    
  }

}
