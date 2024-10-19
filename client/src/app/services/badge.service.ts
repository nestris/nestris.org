import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TabID } from '../models/tabs';
import { JsonMessageType } from '../shared/network/json-message';
import { WebsocketService } from './websocket.service';
import { FetchService } from './fetch.service';


/*
Handles whether the red circular badges are shown for each of the tabs
*/

@Injectable({
  providedIn: 'root'
})
export class BadgeService {

  private badgeActive$: Map<TabID, BehaviorSubject<boolean>> = new Map();


  constructor(
    private websocketService: WebsocketService
  ) {

    Object.values(TabID).forEach(tabID => {
      this.badgeActive$.set(tabID, new BehaviorSubject(false));
    });


  }

  // set the badge to active
  setBadgeActive(tabID: TabID): void {
    this.badgeActive$.get(tabID)!.next(true);
  }

  // set the badge to inactive
  setBadgeInactive(tabID: TabID): void {
    this.badgeActive$.get(tabID)!.next(false);
  }

  isBadgeActive$(tabID: TabID): Observable<boolean> {
    return this.badgeActive$.get(tabID)!.asObservable();
  }

}
