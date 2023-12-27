import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum Tab {
  MY_PROFILE = 'my-profile',
  FRIENDS = 'friends',
  ALERTS = 'alerts',
  HOME = 'home',
  PLAY = 'play',
  REVIEW = 'review',
  PUZZLES = 'puzzles',
  LEADERBOARD = 'leaderboard',
  MORE = 'more',
}

export type ParametrizedTab = {
  tab: Tab,
  params: URLSearchParams | undefined,
};

@Injectable({
  providedIn: 'root'
})
export class SidebarTabService {

  private selectedTab$ = new BehaviorSubject<ParametrizedTab>({tab: Tab.HOME, params: undefined});

  getSelectedTab(): Observable<ParametrizedTab> {
    return this.selectedTab$.asObservable();
  }

  setSelectedTab(tab: Tab, params?: URLSearchParams): void {

    // set URL to {baseUrl}/{tab}?{params}
    // e.g. /home?param1=foo&param2=bar
    history.pushState({}, '', `/${tab}${params ? '?' + params.toString() : ''}`);
    this.selectedTab$.next({tab, params});
  }

}
