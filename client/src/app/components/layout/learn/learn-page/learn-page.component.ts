import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-learn-page',
  templateUrl: './learn-page.component.html',
  styleUrls: ['./learn-page.component.scss']
})
export class LearnPageComponent {

  constructor(
    private router: Router
  ) { }

  routeToDashboard() {
    this.router.navigate(['/learn']);
  }

}
