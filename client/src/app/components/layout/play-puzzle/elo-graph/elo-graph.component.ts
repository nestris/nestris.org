import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-elo-graph',
  templateUrl: './elo-graph.component.html',
  styleUrls: ['./elo-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EloGraphComponent implements OnChanges {

  @Input() eloHistory: number[] = [1000];

  eloLines!: number[]; // the four lines to plot


  ngOnChanges(): void {

    console.log("elo history: ", this.eloHistory);

    // get lowest and round down to the nearest 100
    let lowest = Math.min(...this.eloHistory) - 10;
    lowest = Math.floor(lowest / 100) * 100;

    let highest = Math.max(...this.eloHistory) + 10;
    let delta = highest - lowest;

    // round delta up to nearest 300
    delta = Math.ceil(delta / 300) * 300;
    highest = lowest + delta;

    // now, we can plot four lines from x = lowest to x = highest
    this.eloLines = [lowest, lowest + delta / 3, lowest + delta * 2 / 3, highest];
    console.log(this.eloLines);
      
  }

}
