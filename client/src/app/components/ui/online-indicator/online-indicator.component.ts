import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-online-indicator',
  templateUrl: './online-indicator.component.html',
  styleUrls: ['./online-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineIndicatorComponent {
  @Input() isOnline: boolean = false;

  // used in template to assign a css class based on status
  // offline is grey, idle is green, busy is orange
  // colors defined in css
  getStatusClass(): string {
    if (!this.isOnline) return 'offline';
    else return 'idle';
  }

}
