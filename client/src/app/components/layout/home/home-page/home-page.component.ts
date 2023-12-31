import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { getTopMoves } from 'client/src/app/libraries/wasm-stackrabbit/wasm-stackrabbit';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit {

  constructor() {
  }

  async ngOnInit() {

    const req = "00000000000000000000000000000000000000000000000000000000000000011000000001100100000110110000011111000011111100011111110001111111001111111100111111111011111111101111111110111111111011111111101111111110|19|192|2|0|X.|200|6|";
    const res = getTopMoves(req);
    console.log(res);

  }

}
