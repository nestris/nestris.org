import { Injectable } from '@angular/core';
import { filter, Observable, Subject } from 'rxjs';
import { InvitationMessage, InvitationMode, JsonMessageType } from '../../shared/network/json-message';
import { Method } from '../fetch.service';
import { StateService } from './state.service';
import { Invitation, InvitationType } from 'src/app/shared/models/invitation';
import { MeService } from './me.service';

export enum InvitationRelationship {
  NO_ACTIVE_INVITATION = "NO_ACTIVE_INVITATION",
  IS_SENDER = "IS_SENDER",
  IS_RECEIVER = "IS_RECEIVER",
}


@Injectable({
  providedIn: 'root'
})
export class InvitationsService extends StateService<Invitation[]>() {

  acceptedInvitation$: Subject<Invitation> = new Subject<Invitation>();

  constructor(
    private readonly meService: MeService,
  ) {
    super([JsonMessageType.INVITATION], "Invitations");

    // Log accepted invitations
    this.onAcceptInvitation().subscribe(invitation => {
      console.log(`Accepted invitation: ${invitation}`);
    });

  }

  /**
   * Get the list of invitations of a specific type
   * @param type The type of invitation to filter by
   * @returns The list of invitations of the specified type
   */
  public async getInvitationsOfType(type: InvitationType): Promise<Invitation[]> {
    return (await this.get()).filter(invitation => invitation.type === type);
  }

  /**
   * Get the list of invitations of a specific type as an observable
   * @param type The type of invitation to filter by
   * @returns The list of invitations of the specified type as an observable
   */
  public getInvitationsOfType$(type: InvitationType): Observable<Invitation[]> {
    return this.get$().pipe(
      filter(invitations => invitations.some(invitation => invitation.type === type))
    );
  }

  /**
   * Get the invitation by invitationID
   * @param invitationID The invitationID to filter by
   * @returns The invitation with the specified invitationID
   */
  public async getInvitationByInvitationID(invitationID: string): Promise<Invitation | undefined> {
    return (await this.get()).find(invitation => invitation.invitationID === invitationID);
  }

  /**
   * Get the invitation between two users of a specific type
   * @param type The type of invitation to filter by
   * @param senderID The sender userid of the invitation
   * @param receiverID The receiver userid of the invitation
   * @returns 
   */
  public async getInvitationBySenderReceiver(type: InvitationType, senderID: string, receiverID: string): Promise<Invitation | undefined> {
    return (await this.getInvitationsOfType(type)).find(invitation => invitation.senderID === senderID && invitation.receiverID === receiverID);
  }

  /**
   * Get the list of invitations sent by a specific user
   * @param type The type of invitation to filter by
   * @param senderID The sender userid to filter by
   * @returns The list of invitations sent by the specified user
   */
  public async getInvitationsBySender(type: InvitationType, senderID: string): Promise<Invitation[]> {
    return (await this.get()).filter(invitation => invitation.senderID === senderID && invitation.type === type);
  }

  /**
   * Get the relationship of a given userid with the logged in user for a specific type of invitation
   * @param userid The userid to check the relationship with
   * @returns The relationship of the given userid with the logged in user
   */
  public async getInvitationRelationship(type: InvitationType, userid: string): Promise<InvitationRelationship> {

    const myID = (await this.meService.get()).userid;
    
    // Determine the relationship based on the invitation
    if (await this.getInvitationBySenderReceiver(type, myID, userid)) return InvitationRelationship.IS_SENDER;
    if (await this.getInvitationBySenderReceiver(type, userid, myID)) return InvitationRelationship.IS_RECEIVER;
    return InvitationRelationship.NO_ACTIVE_INVITATION;
  }

  /**
   * Get the accepted invitation as an observable
   * @returns The accepted invitation as an observable
   */
  public onAcceptInvitation(): Observable<Invitation> {
    return this.acceptedInvitation$.asObservable();
  }

  /**
   * Filter the accepted invitation by type, only emitting the accepted invitation if it matches the specified type
   * @param type The type of invitation to filter by
   * @returns 
   */
  public onAcceptInvitationOfType(type: InvitationType): Observable<Invitation> {
    return this.acceptedInvitation$.asObservable().pipe(
      filter((invitation: Invitation) => invitation.type === type)
    );
  }

  /**
   * Accept a friend request
   * @param invitation The friend request to accept
   */
  public createInvitation(invitation: Invitation) {
    this.sendInvitationMessage(InvitationMode.CREATE, invitation);
  }

  /**
   * Send an invitation message to the server to create, accept, or cancel an invitation
   * @param mode Whether to create, accept, or cancel the invitation
   * @param invitation The invitation to create, accept, or cancel
   */
  public sendInvitationMessage(mode: InvitationMode, invitation: Invitation): void {
    this.websocketService.sendJsonMessage(new InvitationMessage(mode, invitation));
  }

  /**
   * Fetch the list of invitations
   * @returns The list of invitations
   */
  protected override async fetch(): Promise<Invitation[]> {
    return await this.fetchService.fetch<Invitation[]>(Method.GET, `/api/v2/invitations`);
  }

  /**
   * Update the list of invitations when an invitation message is received
   * @param event The invitation message
   * @param state The current list of invitations
   * @returns The updated list of invitations
   */
  protected override onEvent(event: InvitationMessage, state: Invitation[]): Invitation[] {

    switch (event.mode) {
      case InvitationMode.CREATE: // If a new invitation was created, add invitation
        state.push(event.invitation);
        break;
      case InvitationMode.CANCEL: // If an invitation was cancelled, remove invitation
        state = state.filter(invitation => invitation.invitationID !== event.invitation.invitationID);
        break;
      case InvitationMode.ACCEPT: // If an invitation was accepted, remove invitation and emit accepted invitation
        state = state.filter(invitation => invitation.invitationID !== event.invitation.invitationID);
        this.acceptedInvitation$.next(event.invitation);
        break;
    }

    return state;
  }
}
