import { Component } from "@angular/core";


@Component({
  selector: 'app-matchmaking-loading-page',
  templateUrl: './matchmaking-loading-page.component.html',
  styleUrls: ['./matchmaking-loading-page.component.scss']
})
export class MatchmakingLoadingPageComponent {

    score: number = 0;
    scoreVisible: boolean = false;

    setScore(score: number) {
        this.score = score;

        if (score > 0) this.scoreVisible = true;
    }

}
