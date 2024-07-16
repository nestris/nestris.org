import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-animation',
  templateUrl: './loading-animation.component.html',
  styleUrls: ['./loading-animation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingAnimationComponent {
  @Input() size: number = 60;
}
