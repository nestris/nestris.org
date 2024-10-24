import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerStatsService } from './server-stats.service';

export enum BannerType {
  BETA_WARNING = "BETA_WARNING",
  STAGING_WARNING = "STAGING_WARNING",
  DEV_WARNING = "DEV_WARNING",
  SERVER_RESTART_WARNING = "SERVER_RESTART_WARNING",
  GUEST_WARNING = "GUEST_WARNING",
}

export enum BannerPriority {
  HIGH,
  LOW
}

export interface Banner {
  id: string;
  priority: BannerPriority;
  message: string;
  color: string;
  button?: {
    text: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BannerManagerService {

  private allBanners: Banner[] = [];

  private banners$ = new BehaviorSubject<Banner[]>([]);

  addBanner(banner: Banner) {

    // Prevent duplicate banners
    if (this.allBanners.find((b) => b.id === banner.id)) {
      return;
    }

    // Add the banner
    this.allBanners.push(banner);
    this.updateBanners();
  }

  removeBanner(id: string) {
    this.allBanners = this.allBanners.filter((b) => b.id !== id);
    this.updateBanners();
  }

  // Update banners$ with allBanners. If any banners are high priority, show only high-priority banners.
  updateBanners() {

    const highPriorityBanners = this.allBanners.filter((b) => b.priority === BannerPriority.HIGH);

    if (highPriorityBanners.length > 0) {
      this.banners$.next(highPriorityBanners);
    } else {
      this.banners$.next(this.allBanners);
    }

  }

  getBanners$(): Observable<Banner[]> {
    return this.banners$.asObservable();
  }

}

