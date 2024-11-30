import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Point } from '../shared/tetris/point';

/*
In conjunction with TooltipDirective and TooltipComponent, this service
makes possible the ability to add a [tooltip] directive to any component, so that
a text tooltip would appear on hover.

NONE OF THESE FUNCTIONS SHOULD BE CALLED DIRECTLY. The TooltipDirective will
call these functions when necessary.
*/

export interface TooltipInfo {
  text: string;
  position: Point;
}

@Injectable({
  providedIn: 'root'
})
export class TooltipService {

  private info$ = new BehaviorSubject<TooltipInfo | undefined>(undefined);

  // set by TooltipDirective when mouse moves
  setPosition(x: number, y: number) {

    const prevInfo = this.info$.getValue();
    if (prevInfo === undefined) return;

    this.info$.next({
      text: prevInfo.text,
      position: { x, y },
    });
  }

  // set by TooltipDirective when mouse enters
  show(text: string, x: number, y: number) {
    this.info$.next({
      text,
      position: { x, y },
    });
  }

  // set by TooltipDirective when mouse leaves
  hide() {
    this.info$.next(undefined);
  }

  // exposes an observable for tooltip info so TooltipComponent can subscribe to it
  getTooltipInfo$() : Observable<TooltipInfo | undefined> {
    return this.info$.asObservable();
  }
}
