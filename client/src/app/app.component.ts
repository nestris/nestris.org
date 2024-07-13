import { Component, OnInit } from '@angular/core';
import { getHello } from './shared/test';
import { isDevMode } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'client-app';

  ngOnInit() {
  }

  get() {
    return `Is dev mode: ${isDevMode()}`;
  }

}
