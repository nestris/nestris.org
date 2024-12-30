import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

/*
Graphs the last 15 elo values
*/

@Component({
  selector: 'app-elo-graph',
  templateUrl: './elo-graph.component.html',
  styleUrls: ['./elo-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EloGraphComponent implements OnChanges {

  @Input() eloHistory: number[] = [1000];

  eloLines!: number[]; // the four lines to plot
  invertedEloPairs!: [number, number][]; // the pairs of elo values to plot
  invertedEloHistory!: number[]; // the elo history, but inverted
  lastResult!: boolean; // whether the last result was a win or loss

  // because SVG y coordinate is flipped, we need to invert the elo
  invertElo(elo: number): number {
    return this.eloLines[3] - (elo - this.eloLines[0])
  }


  ngOnChanges(): void {

    if (this.eloHistory.length < 2) {
      return;
    }

    const eloHistory = this.eloHistory.slice(-15);

    this.lastResult = eloHistory[eloHistory.length - 1] > eloHistory[eloHistory.length - 2];

    // get lowest and round down to the nearest 100
    let lowest = Math.min(...eloHistory) - 10;
    lowest = Math.floor(lowest / 100) * 100;

    let highest = Math.max(...eloHistory) + 10;
    let delta = highest - lowest;

    // round delta up to nearest 300
    delta = Math.ceil(delta / 300) * 300;
    highest = lowest + delta;

    // now, we can plot four lines from x = lowest to x = highest
    this.eloLines = [lowest, lowest + delta / 3, lowest + delta * 2 / 3, highest];
    console.log(this.eloLines);

    // calculate the inverted elo history
    this.invertedEloHistory = eloHistory.map(elo => this.invertElo(elo));

    // calculate the adjacent pairs of elo values
    this.invertedEloPairs = [];
    for (let i = 0; i < this.invertedEloHistory.length - 1; i++) {
      this.invertedEloPairs.push([this.invertedEloHistory[i], this.invertedEloHistory[i + 1]]);
    }
      
  }

}
