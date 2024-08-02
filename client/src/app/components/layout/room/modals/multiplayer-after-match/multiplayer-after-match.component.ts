import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { getMatchScore, MatchPoint, MultiplayerData, PlayerRole } from 'src/app/shared/models/multiplayer';
import { Role } from 'src/app/shared/models/room-info';

@Component({
  selector: 'app-multiplayer-after-match',
  templateUrl: './multiplayer-after-match.component.html',
  styleUrls: ['./multiplayer-after-match.component.scss']
})
export class MultiplayerAfterMatchComponent {
  @Input() data!: MultiplayerData;
  @Input() myRole?: Role;

  readonly ButtonColor = ButtonColor;

  constructor(
    private router: Router
  ) { }

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

  newMatch() {
    console.log('new match');
  }
  
  leaveMatch() {
    this.router.navigate(['/']);
  }

}
