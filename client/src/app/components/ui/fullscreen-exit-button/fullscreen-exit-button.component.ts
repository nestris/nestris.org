import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-fullscreen-exit-button',
  templateUrl: './fullscreen-exit-button.component.html',
  styleUrls: ['./fullscreen-exit-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullscreenExitButtonComponent {

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  exit() {

    const exitRoute = this.route.snapshot.queryParamMap.get('exit');

    let route;
    if (exitRoute) route = decodeURIComponent(exitRoute);
    else route = "/puzzles";

    this.router.navigate([route]);

  }

}
