import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, Observable } from 'rxjs';
import { DeploymentEnvironment, ServerStats } from '../shared/models/server-stats';
import { fetchServer2, Method } from '../scripts/fetch-server';
import { BannerManagerService, BannerType } from './banner-manager.service';

@Injectable({
  providedIn: 'root'
})
export class ServerStatsService {

  private serverStats$ = new BehaviorSubject<ServerStats | undefined>(undefined);

  constructor(private readonly bannerManager: BannerManagerService) {
    this.fetchServerStats();
  }

  private async fetchServerStats(): Promise<void> {
    try {
      const stats = await fetchServer2<ServerStats>(Method.GET, '/api/v2/server-stats');
      this.serverStats$.next(stats);
      
      if (stats.environment === DeploymentEnvironment.PRODUCTION) {
        this.bannerManager.addBanner({
          id: BannerType.BETA_WARNING,
          color: "#3C5EB7",
          message: "nestris.org is in alpha, so progress may be lost at any time. Learn more at our <a href='https://discord.gg/4xkBHvGtzp' target='_blank'><u>Discord</u></a> server."
        });
      } else if (stats.environment === DeploymentEnvironment.STAGING) {
        this.bannerManager.addBanner({
          id: BannerType.STAGING_WARNING,
          color: "#B73C3C",
          message: "You are on the staging branch. The website, server, and database are isolated from production."
        });
      } else if (stats.environment === DeploymentEnvironment.DEV) {
        this.bannerManager.addBanner({
          id: BannerType.DEV_WARNING,
          color: "#6c3cb7",
          message: "You are running on a local development environment. Learn more at our <a href='https://discord.gg/4xkBHvGtzp' target='_blank'><u>Discord</u></a> server."
        });
      }
    } catch (error) {
      console.error('Failed to fetch server stats:', error);
    }
  }

  getServerStats$(): Observable<ServerStats> {
    return this.serverStats$.pipe(
      filter((stats): stats is ServerStats => stats !== undefined)
    );
  }

  // Wait for the server stats to be fetched before returning
  async waitForServerStats(): Promise<ServerStats> {
    return firstValueFrom(this.getServerStats$());
  }
}
