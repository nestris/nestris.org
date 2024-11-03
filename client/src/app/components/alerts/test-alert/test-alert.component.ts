import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-test-alert',
  templateUrl: './test-alert.component.html',
  styleUrls: ['./test-alert.component.scss']
})
export class TestAlertComponent {
  @Input() param1: string = '';
  @Input() param2: string = '';
}
