import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ParametrizedTab, TabID } from '../models/tabs';

/*
Handles which tab is selected in the sidebar. Exposes an observable that emits the currently selected tab.
*/

@Injectable({
    providedIn: 'root'
})
export class SidebarTabService {

  private selectedTab$ = new BehaviorSubject<ParametrizedTab>({tab: TabID.HOME, params: undefined});


  constructor() {

    // whenever user clicks back/forward button, update selectedTab$ to state
    window.addEventListener('popstate', (event) => {
      this.setSelectedTab(event.state);
    });

  }

  getSelectedTab(): Observable<ParametrizedTab> {
    return this.selectedTab$.asObservable();
  }

  // set the selected tab. if pushToURLHistory is true, update the URL to reflect the new tab
  setSelectedTab(parametrizedTab: ParametrizedTab, pushToURLHistory: boolean = true): void {

    this.selectedTab$.next(parametrizedTab);

    if (pushToURLHistory) {
      history.pushState(parametrizedTab, '', `/${parametrizedTab.tab}${parametrizedTab.params ? '?' + parametrizedTab.params.toString() : ''}`);
    }
    
  }

}
