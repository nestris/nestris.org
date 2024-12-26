import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { calculatePlacementScore, EVALUATION_TO_COLOR, placementScoreRating } from 'src/app/shared/evaluation/evaluation';

export interface RatedMove {
  bestEval: number | null;
  playerEval: number | null;
}

@Component({
  selector: 'app-eval-bar',
  templateUrl: './eval-bar.component.html',
  styleUrls: ['./eval-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvalBarComponent implements OnChanges{
  @Input() width: number = 30;
  @Input() backgroundColor: string = "#151515";
  @Input() borderRadius: number = 10;
  @Input() ratedMove: RatedMove = {bestEval: null, playerEval: null};
  

  bestPercent: number = 0; // percent from 0-1 of height for outline
  playerPercent: number = 0; // percent from 0-1 of height for fill
  fillColor: string = "white";

  ngOnChanges(): void {

    if (this.ratedMove.bestEval === null || this.ratedMove.playerEval === null) {
      this.bestPercent = 1;
      this.playerPercent = 0.8;
      this.fillColor = "white";
      return;
    }

    // if the player's evaluation is better than the best evaluation, set the best evaluation to the player's evaluation
    if (this.ratedMove.playerEval > this.ratedMove.bestEval) this.ratedMove.bestEval = this.ratedMove.playerEval;

    this.bestPercent = this.evalToPercent(this.ratedMove.bestEval);
    this.playerPercent = this.evalToPercent(this.ratedMove.playerEval);

    const placementScore = calculatePlacementScore(this.ratedMove.bestEval, this.ratedMove.playerEval);
    this.fillColor = EVALUATION_TO_COLOR[placementScoreRating(placementScore)];
  }

  // converts a raw StackRabbit evaluation to a percent between 0 and 1
  // https://www.desmos.com/calculator/zwhiywxeie
  private evalToPercent(evaluation: number): number {
    const percent = -100 / (evaluation - 151);
    
    // bound between 0 and 1
    return Math.min(1, Math.max(0, percent));
  }
}
