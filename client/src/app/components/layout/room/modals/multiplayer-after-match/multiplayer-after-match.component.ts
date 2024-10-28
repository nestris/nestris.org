import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { FriendsService } from 'src/app/services/state/friends.service';
import { NotificationService } from 'src/app/services/notification.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Challenge } from 'src/app/shared/models/challenge';
import { getMatchScore, MatchPoint, MultiplayerData, PlayerRole } from 'src/app/shared/models/multiplayer';
import { NotificationType } from 'src/app/shared/models/notifications';
import { Role } from 'src/app/shared/models/room-info';
import { JsonMessage, JsonMessageType, RematchOfferedMessage } from 'src/app/shared/network/json-message';

export enum NewMatchMode {
  NEW_RANKED_MATCH = 'NEW_RANKED_MATCH',
  OFFER_REMATCH = 'OFFER_REMATCH',
  ACCEPT_REMATCH = 'ACCEPT_REMATCH'
}

@Component({
  selector: 'app-multiplayer-after-match',
  templateUrl: './multiplayer-after-match.component.html',
  styleUrls: ['./multiplayer-after-match.component.scss']
})
export class MultiplayerAfterMatchComponent implements OnInit, OnDestroy {
  @Input() data!: MultiplayerData;
  @Input() myRole?: Role;

  readonly ButtonColor = ButtonColor;

  private rematchSubscription?: Subscription;
  recievedRematchChallenge$ = new BehaviorSubject<Challenge | undefined>(undefined);
  sentRematch$ = new BehaviorSubject<boolean>(false);

  constructor(
    private fetchService: FetchService,
    private router: Router,
    private websocketService: WebsocketService,
    private notificationService: NotificationService,
    private meService: MeService,
  ) { }

  ngOnInit() {

    this.rematchSubscription = this.websocketService.onEvent(
      JsonMessageType.REMATCH_OFFERED).subscribe(async (message: JsonMessage) => {
        const rematchMessage = message as RematchOfferedMessage;

        console.log('Rematch offered message', rematchMessage);

        // check if the opponent is the same as the one who offered the rematch
        const opponentRole = this.myRole === Role.PLAYER_1 ? Role.PLAYER_2 : Role.PLAYER_1;
        const thisOpponent = this.data.match.playerInfo[opponentRole].userID;
        const rematchOpponent = rematchMessage.challenge.senderid;
        if (thisOpponent !== rematchOpponent) {
          console.log(`Rematch offer from ${rematchOpponent} but expected ${thisOpponent}`);
          return;
        }

        // set rematchSent to true
        this.recievedRematchChallenge$.next(rematchMessage.challenge);
      }
    );

  }

  getScores(): [number, number] {
    const playerScores = getMatchScore(this.data.match);
    const myScore = playerScores[(this.myRole as PlayerRole)];
    const otherScore = playerScores[(this.myRole === Role.PLAYER_1 ? Role.PLAYER_2 : Role.PLAYER_1)];
    return [myScore, otherScore];
  }

  getBannerText(scores: [number, number]): string {
    return `${scores[0]}-${scores[1]} ${scores[0] > scores[1] ? 'Victory' : 'Defeat'}`;
  }

  winningColor(scores: [number, number]): 'blue' | 'red' {
    return scores[0] > scores[1] ? 'blue' : 'red';
  }

  getPlayer(color: string): PlayerRole {
    if (!this.myRole) throw new Error('Internal error: myRole is not set');
    return color === 'blue' ? (this.myRole as PlayerRole) : (this.myRole === Role.PLAYER_1 ? Role.PLAYER_2 : Role.PLAYER_1);
  }

  getScoreForPoint(point: MatchPoint, color: 'blue' | 'red') {
    return ((this.myRole === Role.PLAYER_1) != (color === 'red')) ? point.scorePlayer1 : point.scorePlayer2;
  }

  getPointWinnerColor(point: MatchPoint): 'blue' | 'red' | 'tie' {
    const blueScore = this.getScoreForPoint(point, 'blue');
    const redScore = this.getScoreForPoint(point, 'red');
    if (blueScore > redScore) return 'blue';
    else if (redScore > blueScore) return 'red';
    return 'tie';
  }

  getPointText(point: MatchPoint) {
    switch (this.getPointWinnerColor(point)) {
      case 'blue': return 'Win';
      case 'red': return 'Loss';
      case 'tie': return 'Draw'
    }
  }

  newMatchInfo(rematchRecieved: boolean): {label: string, color: ButtonColor, mode: NewMatchMode} {

    if (this.data.match.isRanked) return {mode: NewMatchMode.NEW_RANKED_MATCH, label: "New Match", color: ButtonColor.BLUE};
    else {

      if (this.sentRematch$.getValue()) return {
        mode: NewMatchMode.OFFER_REMATCH,
        label: "Rematch offer sent",
        color: ButtonColor.BLUE
      };

      if (!rematchRecieved) return {
        mode: NewMatchMode.OFFER_REMATCH,
        label: "Offer Rematch",
        color: ButtonColor.BLUE
      };

      else return {mode: NewMatchMode.ACCEPT_REMATCH, label: "Accept Rematch", color: ButtonColor.GREEN};
    }
  }

  async newMatch(mode: NewMatchMode) {
    switch (mode) {
      case NewMatchMode.OFFER_REMATCH: return await this.offerRematch();
      case NewMatchMode.ACCEPT_REMATCH: return await this.acceptRematch();
    }
  }

  async offerRematch() {
    const userID = await this.meService.getUserID();
    const username = await this.meService.getUsername();
    const sessionID = this.websocketService.getSessionID();
    if (!userID || !username || !sessionID) {
      this.websocketService.logout();
      return;
    }

    const otherPlayer = this.data.match.playerInfo[(this.myRole === Role.PLAYER_1 ? Role.PLAYER_2 : Role.PLAYER_1)];

    // set challenge parameters
    const challenge: Challenge = {
      senderid: userID,
      senderUsername: username,
      senderSessionID: sessionID,
      receiverid: otherPlayer.userID,
      receiverUsername: otherPlayer.username,
      startLevel: this.data.state.startLevel,
      rated: false,
      winningScore: this.data.match.winningScore,
      isRematch: true
    }

    console.log('Offering rematch', challenge);

    // send challenge to server. if successful, close modal
    const { success, error } = await this.fetchService.fetch<{
      success: boolean, error?: string
    }>(Method.POST, '/api/v2/send-challenge', { challenge });

    if (success) {
      this.sentRematch$.next(true);
      this.notificationService.notify(NotificationType.SUCCESS, `Sent a rematch offer to ${otherPlayer.username}`);
    } else {
      this.notificationService.notify(NotificationType.ERROR, "Failed to offer a rematch");
    }
  }

  async acceptRematch() {
  
    const username = await this.meService.getUsername();
    const sessionID = this.websocketService.getSessionID();
    if (!username || !sessionID) {
      console.error('No username or session ID found when accepting challenge');
      return; // should not happen
    }

    console.log('Accepting rematch challenge', this.recievedRematchChallenge$.getValue());

    // send a request to the server to accept the challenge
    // server should send a websocket message back to trigger event to go to room if the challenge is accepted
    await this.fetchService.fetch(Method.POST, '/api/v2/accept-challenge', {
      challenge: this.recievedRematchChallenge$.getValue()!,
      sessionID: sessionID,
    });
  }
  
  leaveMatch() {
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.rematchSubscription?.unsubscribe();
  }

}
