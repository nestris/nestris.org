import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-fullscreen-exit-button',
  templateUrl: './fullscreen-exit-button.component.html',
  styleUrls: ['./fullscreen-exit-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullscreenExitButtonComponent {

  @Input() onExit: () => Promise<void> = async () => {};

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async exit() {

    await this.onExit();

    const exitRoute = this.route.snapshot.queryParamMap.get('exit');

    let route;
    if (exitRoute) route = decodeURIComponent(exitRoute);
    else route = "/";

    this.router.navigate([route]);

  }

}
