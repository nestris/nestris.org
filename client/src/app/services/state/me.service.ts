import { Injectable, OnInit } from '@angular/core';
import { StateService } from './state.service';
import { DBUser } from 'src/app/shared/models/db-user';
import { Method } from '../fetch.service';
import { JsonMessage, JsonMessageType, MeMessage } from 'src/app/shared/network/json-message';

@Injectable({
  providedIn: 'root'
})
export class MeService extends StateService<DBUser> {

  constructor() {
    super([JsonMessageType.ME]);
  }

  protected async fetch(): Promise<DBUser> {
    return await this.fetchService.fetch<DBUser>(Method.GET, '/api/v2/me');
  }

  // ME message contains updated DBUser object
  protected override onEvent(event: JsonMessage, oldState: DBUser): DBUser {
    return (event as MeMessage).me;
  }


}
