import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, filter, map } from 'rxjs';

export enum ModalType {
  CALIBRATE_OCR = "CALIBRATE_OCR",
  CREATE_PUZZLE = "CREATE_PUZZLE",
  AUTH = "AUTH",
}

/*
Manages creation of modals and the modal components automatically.
Call showModal() to show a modal, and hideModal() to hide it.
Each modal type is tied to a component, and the modal manager will automatically
create the component when the modal is shown, and destroy it when the modal is hidden.
*/

@Injectable({
  providedIn: 'root'
})
export class ModalManagerService {

  private activeModal$ = new BehaviorSubject<ModalType | null>(null);
  private lastShownModal$ = new Subject<ModalType>();

  constructor() { }

  getModal$(): Observable<ModalType | null> {
    return this.activeModal$.asObservable();
  }

  getModalWithType$(modalType: ModalType): Observable<boolean> {
    return this.activeModal$.asObservable().pipe(
      map((activeModal) => activeModal === modalType)
    );
  }

  showModal(modalType: ModalType) {

    // delay to next cycle to prevent immediate close
    setTimeout(() => {
      this.activeModal$.next(modalType);
    }, 0);
  }

  hideModal() {
    const lastModal = this.activeModal$.getValue();
    if (lastModal !== null) {
      this.lastShownModal$.next(lastModal);
    }
    this.activeModal$.next(null);
  }

  onHideModal$(): Observable<ModalType> {
    return this.lastShownModal$.asObservable();
  }

  

}
