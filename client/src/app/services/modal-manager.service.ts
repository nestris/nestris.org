import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';

export enum ModalType {
  CALIBRATE_OCR = "CALIBRATE_OCR",
}

@Injectable({
  providedIn: 'root'
})
export class ModalManagerService {

  private activeModal$ = new BehaviorSubject<ModalType | null>(null);

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
    this.activeModal$.next(null);
  }

}
