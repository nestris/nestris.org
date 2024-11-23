import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { InvitationMessage, JsonMessage, JsonMessageType } from '../../shared/network/json-message';
import { FetchService, Method } from '../fetch.service';
import { StateService } from './state.service';
import { Invitation } from 'src/app/shared/models/invitation';


@Injectable({
  providedIn: 'root'
})
export class InvitationsService extends StateService<Invitation[]>() {

  constructor() {
    super([JsonMessageType.INVITATION], "Invitations");
  }

  protected override async fetch(): Promise<Invitation[]> {
    return await this.fetchService.fetch<Invitation[]>(Method.GET, `/api/v2/invitations`);
  }

  // Update the invitation list based on the event
  protected override onEvent(event: InvitationMessage, state: Invitation[]): Invitation[] {

    // TODO

    return state;
  }
}
