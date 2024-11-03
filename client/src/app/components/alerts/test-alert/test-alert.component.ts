import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-test-alert',
  templateUrl: './test-alert.component.html',
  styleUrls: ['./test-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestAlertComponent {
  @Input() hide: boolean = false;
  @Input() param1: string = '';
  @Input() param2: string = '';
}
