import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OnlineUserStatus } from 'src/app/shared/models/friends';

@Component({
  selector: 'app-online-indicator',
  templateUrl: './online-indicator.component.html',
  styleUrls: ['./online-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineIndicatorComponent {
  @Input() status: OnlineUserStatus = OnlineUserStatus.OFFLINE;

  // used in template to assign a css class based on status
  // offline is grey, idle is green, busy is orange
  // colors defined in css
  getStatusClass(): string {
    if (this.status === OnlineUserStatus.OFFLINE) return 'offline';
    else if (this.status === OnlineUserStatus.IDLE) return 'idle';
    else if (this.status === OnlineUserStatus.PLAYING) return 'playing';
    return '';
  }

}
