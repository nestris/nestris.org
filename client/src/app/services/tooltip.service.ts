import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TooltipInfo {
  text: string;
  position: { x: number, y: number };
}

@Injectable({
  providedIn: 'root'
})
export class TooltipService {

  private info$ = new BehaviorSubject<TooltipInfo | undefined>(undefined);

  setPosition(x: number, y: number) {
    this.info$.next({
      text: this.info$.getValue()?.text ?? "",
      position: { x, y },
    });
  }

  show(text: string, x: number, y: number) {
    this.info$.next({
      text,
      position: { x, y },
    });
  }

  hide() {
    this.info$.next(undefined);
  }

  getTooltipInfo$() : Observable<TooltipInfo | undefined> {
    return this.info$.asObservable();
  }
}
