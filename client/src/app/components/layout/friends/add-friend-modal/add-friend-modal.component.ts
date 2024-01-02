import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-add-friend-modal',
  templateUrl: './add-friend-modal.component.html',
  styleUrls: ['./add-friend-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFriendModalComponent {
  @Input() visibility$!: BehaviorSubject<boolean>;

  public typedUsername: string = "";

}
