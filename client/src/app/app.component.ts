import { Component, OnInit } from '@angular/core';
// import { sayHello } from '@shared/test';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'client-app';

  ngOnInit() {
    // sayHello();
  }

}
