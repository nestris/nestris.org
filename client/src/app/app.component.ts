import { Component, OnInit } from '@angular/core';
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

  add(a: number, b: number) {
    return a + b;
  }

}
