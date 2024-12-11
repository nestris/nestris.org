import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-slide-toggle',
  templateUrl: './slide-toggle.component.html',
  styleUrls: ['./slide-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlideToggleComponent {
  @Input() checked = false;
  @Output() setChecked = new EventEmitter<boolean>();

  toggle() {
    this.setChecked.emit(!this.checked);
  }
  
}
