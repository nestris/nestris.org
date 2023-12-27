import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ParametrizedTab, TabID } from '../models/tabs';

@Injectable({
    providedIn: 'root'
})
export class SidebarTabService {

  private selectedTab$ = new BehaviorSubject<ParametrizedTab>({tab: TabID.HOME, params: undefined});


  constructor() {

    console.log('SidebarTabService constructor');

    // whenever user clicks back/forward button, update selectedTab$ to state
    window.addEventListener('popstate', (event) => {
      console.log('popstate', event.state);
      this.setSelectedTab(event.state);
    });

  }

  getSelectedTab(): Observable<ParametrizedTab> {
    console.log('getSelectedTab', this.selectedTab$.value);
    return this.selectedTab$.asObservable();
  }

  setSelectedTab(parametrizedTab: ParametrizedTab, pushToURLHistory: boolean = true): void {

    console.log('setSelectedTab', parametrizedTab);
    this.selectedTab$.next(parametrizedTab);

    if (pushToURLHistory) {
      history.pushState(parametrizedTab, '', `/${parametrizedTab.tab}${parametrizedTab.params ? '?' + parametrizedTab.params.toString() : ''}`);
    }
    
  }

}
