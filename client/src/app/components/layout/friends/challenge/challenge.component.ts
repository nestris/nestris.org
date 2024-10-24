import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Challenge } from 'src/app/shared/models/challenge';


@Component({
  selector: 'app-challenge',
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeComponent implements OnInit {
  @Input() challenge!: Challenge;

  isSender: boolean = false;

  readonly ButtonColor = ButtonColor;
  
  constructor(
    private fetchService: FetchService,
    private websocketService: WebsocketService,
    private meService: MeService
  ) {
    
  }

  async ngOnInit() {
    this.isSender = (await this.meService.getUserID()) === this.challenge.senderid;
  }

  async acceptChallenge() {
  
    const username = this.meService.getUsername();
    const sessionID = this.websocketService.getSessionID();
    if (!username || !sessionID) {
      console.error('No username or session ID found when accepting challenge');
      return; // should not happen
    }

    // send a request to the server to accept the challenge
    // server should send a websocket message back to trigger event to go to room if the challenge is accepted
    await this.fetchService.fetch(Method.POST, '/api/v2/accept-challenge', {
      challenge: this.challenge,
      sessionID: sessionID,
    });
  }

  async rejectChallenge() {

    // send a request to the server to reject the challenge
    // server should send a websocket message back to trigger change if the challenge is rejected
    const result = await this.fetchService.fetch<{success: boolean}>(Method.POST, '/api/v2/reject-challenge', {
      challenge: this.challenge
    });
  }


}
