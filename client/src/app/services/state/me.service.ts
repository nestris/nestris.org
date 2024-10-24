import { Injectable, OnInit } from '@angular/core';
import { StateService } from './state.service';
import { DBUser } from 'src/app/shared/models/db-user';
import { Method } from '../fetch.service';
import { JsonMessage, JsonMessageType, MeMessage } from 'src/app/shared/network/json-message';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MeService extends StateService<DBUser> {

  constructor() {
    super([JsonMessageType.ME]);
  }

  protected async fetch(): Promise<DBUser> {
    const me = await this.fetchService.fetch<DBUser>(Method.GET, '/api/v2/me');

    // Kickstart the websocket connection
    this.websocketService.init(me.userid, me.username);

    return me;
  }

  // ME message contains updated DBUser object
  protected override onEvent(event: JsonMessage, oldState: DBUser): DBUser {
    return (event as MeMessage).me;
  }

  public async getUserID(): Promise<string> {
    return (await this.get()).userid;
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
}
