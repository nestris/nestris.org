import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { testWASM } from 'client/src/app/libraries/wasm-stackrabbit/wasm-stackrabbit-interface';

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

    testWASM();

  }

}
