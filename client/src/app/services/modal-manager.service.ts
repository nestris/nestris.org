import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, map } from 'rxjs';

export enum ModalType {
  CALIBRATE_OCR = "CALIBRATE_OCR",
  CREATE_PUZZLE = "CREATE_PUZZLE",
  AUTH = "AUTH",
  CHALLENGE_PLAYER = "CHALLENGE_PLAYER",
  QUEST_LIST = "QUEST_LIST",
  PROFILE = "PROFILE",
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

  private modalConfig: any = undefined;

  private hideModalCallback?: () => void;

  constructor() { }

  getModal$(): Observable<ModalType | null> {
    return this.activeModal$.asObservable();
  }

  getModalWithType$(modalType: ModalType): Observable<boolean> {
    return this.activeModal$.asObservable().pipe(
      map((activeModal) => activeModal === modalType)
    );
  }

  getModalConfig(): any {
    return this.modalConfig;
  }

  showModal(modalType: ModalType, modalConfig: any = undefined, hideModalCallback?: () => void) {

    // delay to next cycle to prevent immediate close
    setTimeout(() => {
      this.modalConfig = modalConfig;
      this.hideModalCallback = hideModalCallback;
      this.activeModal$.next(modalType);
    }, 0);
  }

  hideModal() {
    const lastModal = this.activeModal$.getValue();
    if (lastModal !== null) {
      this.lastShownModal$.next(lastModal);
    }

    if (this.hideModalCallback) this.hideModalCallback();
    else this.activeModal$.next(null);
  }

  onHideModal$(): Observable<ModalType> {
    return this.lastShownModal$.asObservable();
  }

  

}
