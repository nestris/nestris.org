import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { Challenge } from 'network-protocol/models/challenge';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';

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
    private websocketService: WebsocketService
  ) {
    
  }

  ngOnInit() {
    this.isSender = this.websocketService.getUsername() === this.challenge.sender;
  }

  acceptChallenge() {
    console.log('acceptChallenge');
  }

  rejectChallenge() {
    console.log('rejectChallenge');
  }


}
