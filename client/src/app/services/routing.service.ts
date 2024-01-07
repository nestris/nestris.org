import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, filter, map } from 'rxjs';
import { ParametrizedTab, TabID, isTabFullscreen } from '../models/tabs';
import { WebsocketService } from './websocket.service';


/*
Handles which tab is selected in the sidebar. Exposes an observable that emits the currently selected tab.
*/

@Injectable({
    providedIn: 'root'
})
export class RoutingService {

  private selectedTab$ = new BehaviorSubject<ParametrizedTab>({tab: TabID.HOME, params: undefined});
  private lastTab$ = new BehaviorSubject<TabID | undefined>(undefined);

  constructor(
    private websocketService: WebsocketService
  ) {

    // on log out, go to home page
    this.websocketService.onSignOut().subscribe(() => {
      this.setSelectedTab({tab: TabID.HOME, params: undefined});
    })

  }

  getIsFullscreenMode(): Observable<boolean> {
    return this.getSelectedTab().pipe(
      map((parametrizedTab) => isTabFullscreen(parametrizedTab.tab))
    );
  }

  // observable that emits whenever tab changes
  getSelectedTab(): Observable<ParametrizedTab> {
    return this.selectedTab$.asObservable();
  }

  // observable that emits when switching to the given tab
  onSwitchToTab(tab: TabID): Observable<ParametrizedTab> {
    return this.getSelectedTab().pipe(
      filter((currentTab) => currentTab.tab === tab)
    );
  }

  // get the last tab. not an observable
  getLastTab(): TabID | undefined {
    return this.lastTab$.getValue();
  }

  // observable that emits when leaving the given tab
  onLeaveTab(tab: TabID): Observable<void> {
    return this.lastTab$.asObservable().pipe(
      filter((leftTab) => leftTab === tab),
      map(() => {})
    );
  }

  // set the selected tab.
  setSelectedTab(parametrizedTab: ParametrizedTab): void {
    this.lastTab$.next(this.selectedTab$.getValue().tab);
    this.selectedTab$.next(parametrizedTab);
    // TODO: do something with params
  }

}
