import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-panel',
  templateUrl: './stat-panel.component.html',
  styleUrls: ['./stat-panel.component.scss']
})
export class StatPanelComponent {
  @Input() icon: string = '';
  @Input() label: string = '';
  @Input() value: number = 0;

  numberWithCommas(x: number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
}
