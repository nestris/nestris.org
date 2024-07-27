import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DeploymentEnvironment, ServerStats } from '../shared/models/server-stats';
import { fetchServer2, Method } from '../scripts/fetch-server';
import { BannerManagerService, BannerType } from './banner-manager.service';

@Injectable({
  providedIn: 'root'
})
export class ServerStatsService {

  private serverStats$ = new BehaviorSubject<ServerStats | undefined>(undefined);

  constructor(
    private readonly bannerManager: BannerManagerService
  ) {
    fetchServer2<ServerStats>(Method.GET, '/api/v2/server-stats').then((stats) => {
      this.serverStats$.next(stats);

      if (stats.environment === DeploymentEnvironment.STAGING) bannerManager.addBanner({
        id: BannerType.STAGING_WARNING,
        color: "#B73C3C",
        message: "You are on the staging branch. The website, server, and database are isolated from production."
      })
    });
  }

  getServerStats$(): Observable<ServerStats | undefined> {
    return this.serverStats$.asObservable();
  }

  getServerStats(): ServerStats | undefined {
    return this.serverStats$.getValue();
  }
}
