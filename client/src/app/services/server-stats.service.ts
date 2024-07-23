import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerStats } from '../shared/models/server-stats';
import { fetchServer2, Method } from '../scripts/fetch-server';

@Injectable({
  providedIn: 'root'
})
export class ServerStatsService {

  private serverStats$ = new BehaviorSubject<ServerStats | undefined>(undefined);

  constructor() {
    fetchServer2<ServerStats>(Method.GET, '/api/v2/server-stats').then((stats) => {
      this.serverStats$.next(stats);
    });
  }

  getServerStats$(): Observable<ServerStats | undefined> {
    return this.serverStats$.asObservable();
  }

  getServerStats(): ServerStats | undefined {
    return this.serverStats$.getValue();
  }
}
