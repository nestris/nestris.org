import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoutingService } from './routing.service';
import { NotifierService } from 'angular-notifier';
import { TabID } from '../models/tabs';

export enum Platform {
  ONLINE = "ONLINE",
  OCR = "OCR"
}

@Injectable({
  providedIn: 'root'
})
export class PlatformInterfaceService {

  private platform$ = new BehaviorSubject<Platform>(Platform.ONLINE);

  constructor(
    private routingService: RoutingService,
    private notifierService: NotifierService,
  ) {

    // on play solo, start solo game
    this.routingService.onSwitchToTab(TabID.SOLO).subscribe(() => {
      console.log("Start game");
      this.notifierService.notify("info", "Starting game");
    });

  }

  onPlatformChange(): Observable<Platform> {
    return this.platform$.asObservable();
  }

  setPlatform(platform: Platform) {
    this.platform$.next(platform);
  }


}
