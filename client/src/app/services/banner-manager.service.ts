import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerStatsService } from './server-stats.service';

export enum BannerType {
  BETA_WARNING = "BETA_WARNING",
  STAGING_WARNING = "STAGING_WARNING"
}

export interface Banner {
  id: string;
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

  private banners$ = new BehaviorSubject<Banner[]>([]);

  addBanner(banner: Banner) {
    this.banners$.next([...this.banners$.getValue(), banner]);
  }

  removeBanner(id: string) {
    const banners = this.banners$.getValue().filter((banner) => banner.id !== id);
    this.banners$.next(banners);
  }

  getBanners$(): Observable<Banner[]> {
    return this.banners$.asObservable();
  }

}

