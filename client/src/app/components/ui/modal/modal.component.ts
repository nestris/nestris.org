import { ChangeDetectionStrategy, Component, HostListener, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  @Input() visibility$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  constructor() {
  }

  // if escape key is pressed, close the modal
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.visibility$.next(false);
    }
  }

}
