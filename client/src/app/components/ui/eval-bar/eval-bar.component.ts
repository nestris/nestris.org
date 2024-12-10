import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { calculatePlacementScore, EVALUATION_TO_COLOR, placementScoreRating } from 'src/app/shared/evaluation/evaluation';

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
  @Input() bestEval: number | null = null;
  @Input() playerEval: number | null = null;

  bestPercent: number = 0; // percent from 0-1 of height for outline
  playerPercent: number = 0; // percent from 0-1 of height for fill
  fillColor: string = "white";

  ngOnChanges(): void {

    if (this.bestEval === null || this.playerEval === null) {
      this.bestPercent = 1;
      this.playerPercent = 0.8;
      this.fillColor = "white";
      return;
    }

    this.bestPercent = this.evalToPercent(this.bestEval);
    this.playerPercent = this.evalToPercent(this.playerEval);

    const placementScore = calculatePlacementScore(this.bestEval, this.playerEval);
    this.fillColor = EVALUATION_TO_COLOR[placementScoreRating(placementScore)];

    console.log("bestEval: " + this.bestEval);
    console.log("bestPercent: " + this.bestPercent);
    console.log("playerPercent: " + this.playerPercent);
    console.log("playerEval: " + this.playerEval);
  }

  // converts a raw StackRabbit evaluation to a percent between 0 and 1
  // https://www.desmos.com/calculator/i3xpqfawty
  private evalToPercent(evaluation: number): number {
    const percent = 1.4 / (1 + Math.exp(-0.0114 * (evaluation+10)));
    
    // bound between 0 and 1
    return Math.min(1, Math.max(0, percent));
  }
}
