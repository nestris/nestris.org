import { Injectable, OnInit } from '@angular/core';
import { StateService } from './state.service';
import { DBUser, LoginMethod } from 'src/app/shared/models/db-user';
import { Method } from '../fetch.service';
import { JsonMessage, JsonMessageType, MeMessage } from 'src/app/shared/network/json-message';
import { map, Observable } from 'rxjs';
import { BannerManagerService, BannerPriority, BannerType } from '../banner-manager.service';

@Injectable({
  providedIn: 'root'
})
export class MeService extends StateService<DBUser>() {

  constructor(
    private readonly bannerManager: BannerManagerService,
  ) {
    super([JsonMessageType.ME], "Me");
  }

  private decode(user: DBUser) {
    user.created_at = new Date(user.created_at);
    user.last_online = new Date(user.last_online);
    return user;
  }

  protected async fetch(): Promise<DBUser> {

    let me: DBUser;
    try {
      // Fetch the user's information
      me = this.decode(await this.fetchService.fetch<DBUser>(Method.GET, '/api/v2/me'));
    } catch (e) {
      // If cannot fetch me, redirect to login
      if (location.pathname !== '/login') location.href = '/login';
      throw e;
    }

    // Kickstart the websocket connection
    this.websocketService.init(me.userid, me.username);

    return me;
  }

  // ME message contains updated DBUser object
  protected override onEvent(event: JsonMessage, oldState: DBUser): DBUser {
    return this.decode((event as MeMessage).me);
  }

  protected override onFetch(me: DBUser): void {

    // Add banner for guest mode
    if (me.login_method === LoginMethod.GUEST) {
      this.bannerManager.addBanner({
        id: BannerType.GUEST_WARNING,
        priority: BannerPriority.HIGH,
        message: 'You are signed in as a guest. Progress will not be saved - login to save your progress!',
        color: '#B7693C',
        button: {
          text: 'Login',
          callback: () => this.websocketService.leaveGuestAndLogin()
        }
      }) 
    } else {
      this.bannerManager.removeBanner(BannerType.GUEST_WARNING);
    }
  }

  public async getUserID(): Promise<string> {
    return (await this.get()).userid;
  }

  public getUserIDSync(): string | undefined {
    return this.getSync()?.userid;
  }

  public async getUsername(): Promise<string> {
    return (await this.get()).username;
  }

  public getUserID$(): Observable<string> {
    return this.get$().pipe(map(user => user.userid));
  }

  public getUsername$(): Observable<string> {
    return this.get$().pipe(map(user => user.username));
  }

  public async waitForAuth(): Promise<void> {
    await this.get();
  }
}
