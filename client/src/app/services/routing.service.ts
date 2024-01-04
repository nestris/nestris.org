import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { ParametrizedTab, TabID } from '../models/tabs';
import { WebsocketService } from './websocket.service';

// during fullscreen mode, sidebar is not shown and page component gets full screen
export enum FullscreenMode {
  DISABLED = "DISABLED",
  SOLO = "SOLO",
  MULTIPLAYER = "MULTIPLAYER"
}

/*
Handles which tab is selected in the sidebar. Exposes an observable that emits the currently selected tab.
*/

@Injectable({
    providedIn: 'root'
})
export class RoutingService {

  private selectedTab$ = new BehaviorSubject<ParametrizedTab>({tab: TabID.HOME, params: undefined});
  private fullscreenMode$ = new BehaviorSubject<FullscreenMode>(FullscreenMode.DISABLED);

  constructor(
    private websocketService: WebsocketService
  ) {

    // whenever user clicks back/forward button, update selectedTab$ to state
    window.addEventListener('popstate', (event) => {
      this.setSelectedTab(event.state);
    });

    // on log out, go to home page
    this.websocketService.onSignOut().subscribe(() => {
      this.setSelectedTab({tab: TabID.HOME, params: undefined});
    })

  }

  getFullscreenMode(): Observable<FullscreenMode> {
    return this.fullscreenMode$.asObservable();
  }

  setFullscreenMode(mode: FullscreenMode) {
    this.fullscreenMode$.next(mode);
  }

  getSelectedTab(): Observable<ParametrizedTab> {
    return this.selectedTab$.asObservable();
  }

  onSwitchToTab(tab: TabID): Observable<ParametrizedTab> {
    return this.getSelectedTab().pipe(
      filter((currentTab) => currentTab.tab === tab)
    );
  }

  // set the selected tab. if pushToURLHistory is true, update the URL to reflect the new tab
  setSelectedTab(parametrizedTab: ParametrizedTab, pushToURLHistory: boolean = true): void {

    this.selectedTab$.next(parametrizedTab);

    if (pushToURLHistory) {
      history.pushState(parametrizedTab, '', `/${parametrizedTab.tab}${parametrizedTab.params ? '?' + parametrizedTab.params.toString() : ''}`);
    }
  }

}
