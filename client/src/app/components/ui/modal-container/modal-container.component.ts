import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';

@Component({
  selector: 'app-modal-container',
  templateUrl: './modal-container.component.html',
  styleUrls: ['./modal-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalContainerComponent {
  
  public visibility$ = new BehaviorSubject<boolean>(false);

  readonly ModalType = ModalType;

  constructor(
    public modalManager: ModalManagerService
  ) {

    // show modal when modal type is not null

    this.modalManager.getModal$().subscribe((modal) => {

      console.log("Modal changed to " + modal);

      const newVisibility = modal !== null;

      if (this.visibility$.getValue() !== newVisibility) {
        this.visibility$.next(newVisibility);
      };

    });

    // when click away from modal, close modal
    this.visibility$.subscribe((visibility) => {
      if (!visibility) {
        this.modalManager.hideModal();
      }
    });

  }


}
