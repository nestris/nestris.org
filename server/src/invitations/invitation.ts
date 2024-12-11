import { Invitation, InvitationType, InvitationCancellationReason } from "../../shared/models/invitation";
import { NotificationType } from "../../shared/models/notifications";
import { InvitationMessage, InvitationMode, SendPushNotificationMessage } from "../../shared/network/json-message";
import { OnSessionDisconnectEvent, OnUserActivityChangeEvent, OnUserDisconnectEvent } from "../online-users/online-user-events";
import { OnlineUserManager } from "../online-users/online-user-manager";

export class InvitationError extends Error {
    constructor(message: string, public readonly sendError: boolean = false) {
        super(message);
        this.name = "InvitationError";
    }
}

/**
 * The requirement for sending, accepting, and rejecting invitations.
 */
export enum InvitationRequirement {

    // Invitation can be sent and accepted any time, as long as both users exist.
    NONE = "NONE", 

    // Invitation can only be sent if both users are not in an activity. If either user starts an activity, the invitation is automatically rejected.
    // Additionally, if the sender's session is closed, the invitation is automatically cancelled.
    SESSION_NOT_IN_ACTIVITY = "SESSION_NOT_IN_ACTIVITY", 
}


/**
 * This module handles invitations, which represent interactions where 
 * one user (the inviter) sends an invitation to another user (the invitee).
 * The invitee can choose to accept or reject the invitation.
 * Examples of invitations include friend requests, match requests, or event invites.
 * 
 * Two users can share exactly 0 or 1 open invitations between them.
 */
export abstract class InvitationManager<I extends Invitation = Invitation> {

    // The type of invitation this manager handles. There can only be one manager per type.
    public abstract readonly invitationType: InvitationType;

    // The requirement for sending, accepting, and rejecting invitations.
    protected abstract readonly invitationRequirement: InvitationRequirement;

    /**
     * All open invitations, indexed by the sender's userid.
     */
    private invitationsBySender: Map<string, I[]> = new Map();

    /**
     * All open invitations, indexed by the receiver's userid.
     */
    private invitationsByReceiver: Map<string, I[]> = new Map();


    constructor(
        protected readonly users: OnlineUserManager,
    ) {}

    /**
     * Get the open invitations sent to or sent by the user with the given userid.
     * @param userid The userid to get open invitations for.
     */
    public getOpenInvitationsForUser(userid: string): I[] {

        // All invitations where the user is the sender.
        const sentInvitations = this.invitationsBySender.get(userid) ?? [];

        // All invitations where the user is the receiver.
        const receivedInvitations = this.invitationsByReceiver.get(userid) ?? [];

        // Combine the two lists.
        return [...sentInvitations, ...receivedInvitations];
    }

    // ------------ Private methods for internal use ------------

    /**
     * Whether the user is allowed to send or accept an invitation, based on the requirement.
     * @param userid The user to check.
     */
    private eligibleForInvitation(userid: string): boolean {
        switch (this.invitationRequirement) {
            case InvitationRequirement.NONE:
                return true;
            case InvitationRequirement.SESSION_NOT_IN_ACTIVITY:
                return !this.users.isUserInActivity(userid);
            default:
                throw new Error("Invalid invitation requirement.");
        }
    }

    /**
     * Get the invitation where user1 is the sender and user2 is the receiver, or vice versa.
     * @param user1ID The userid of the first user. Order does not matter.
     * @param user2ID The userid of the second user. Order does not matter.
     * @returns The invitation between the two users, or undefined if there is none.
     */
    private getInvitationByUsers(user1ID: string, user2ID: string): I | undefined {

        // Check if user1 has invited user2.
        const user1Invitations = this.invitationsBySender.get(user1ID);
        if (user1Invitations && user1Invitations.some(invitation => invitation.receiverID === user2ID))
            return user1Invitations.find(invitation => invitation.receiverID === user2ID);
        
        // Check if user2 has invited user1.
        const user2Invitations = this.invitationsBySender.get(user2ID);
        if (user2Invitations && user2Invitations.some(invitation => invitation.receiverID === user1ID))
            return user2Invitations.find(invitation => invitation.receiverID === user1ID);

        // No invitation found.
        return undefined;
    }

    /**
     * Get the invitation where the sender is senderID and the receiver is receiverID.
     * @param senderID The sender's userid.
     * @param receiverID The receiver's userid.
     * @returns The invitation between the sender and receiver, or undefined if there is none.
     */
    private getInvitationBySenderReceiver(senderID: string, receiverID: string): I | undefined {

        const senderInvitations = this.invitationsBySender.get(senderID);
        if (senderInvitations) {
            return senderInvitations.find(invitation => invitation.receiverID === receiverID);
        }
        return undefined;
    }

    /**
     * Add an invitation to the list of open invitations.
     * @param invitation The invitation to add.
     * @throws InvitationError if the an invitation between the sender and receiver in either direction already exists.
     */
    private addInvitation(invitation: I): void {

        // Check if there is already an invitation between the sender and receiver.
        const existingInvitation = this.getInvitationByUsers(invitation.senderID, invitation.receiverID);
        if (existingInvitation) {
            throw new InvitationError(`User ${invitation.senderUsername} has already invited ${invitation.receiverUsername}.`);
        }

        // Add the invitation to the sender's list of open invitations.
        if (!this.invitationsBySender.has(invitation.senderID)) {
            this.invitationsBySender.set(invitation.senderID, []);
        }
        this.invitationsBySender.get(invitation.senderID)!.push(invitation);

        // Add the invitation to the receiver's list of open invitations.
        if (!this.invitationsByReceiver.has(invitation.receiverID)) {
            this.invitationsByReceiver.set(invitation.receiverID, []);
        }
        this.invitationsByReceiver.get(invitation.receiverID)!.push(invitation);
    }

    /**
     * Remove an invitation from the list of open invitations.
     * @param invitation The invitation to remove.
     */
    private removeInvitation(invitation: I): void {

        // Remove the invitation from the sender's list of open invitations.
        const senderInvitations = this.invitationsBySender.get(invitation.senderID);
        if (!senderInvitations) {
            throw new InvitationError(`User ${invitation.senderUsername} has no open invitations.`);
        }
        const senderIndex = senderInvitations.findIndex(openInvitation => openInvitation.invitationID === invitation.invitationID);
        if (senderIndex === -1) {
            throw new InvitationError(`User ${invitation.senderUsername} has not invited ${invitation.receiverUsername}.`);
        }
        senderInvitations.splice(senderIndex, 1);

        // Remove the invitation from the receiver's list of open invitations.
        const receiverInvitations = this.invitationsByReceiver.get(invitation.receiverID);
        if (!receiverInvitations) {
            throw new InvitationError(`User ${invitation.receiverUsername} has no open invitations.`);
        }
        const receiverIndex = receiverInvitations.findIndex(openInvitation => openInvitation.invitationID === invitation.invitationID);
        if (receiverIndex === -1) {
            throw new InvitationError(`User ${invitation.receiverUsername} has not been invited by ${invitation.senderUsername}.`);
        }
        receiverInvitations.splice(receiverIndex, 1);
    }

    // ------------ Public methods for InvitationConsumer to use ------------

    /**
     * Create an invitation from one user to another.
     * @param invitation The invitation to create.
     */
    public async createInvitation(invitation: I): Promise<void> {

        // Check if the sender is allowed to send an invitation.
        if (!this.eligibleForInvitation(invitation.senderID)) {
            throw new InvitationError(`${invitation.senderUsername} is busy!`, true);
        }

        // Check if the receiver is allowed to receive an invitation.
        if (!this.eligibleForInvitation(invitation.senderID)) {
            throw new InvitationError(`${invitation.senderUsername} is busy!`, true);
        }

        // Check if there was an error creating the invitation, and if so notify the sender.
        const error = await this.errorCreatingInvitation(invitation);
        if (error) {
            this.users.sendToUser(invitation.senderID, new SendPushNotificationMessage(NotificationType.ERROR, error));
            return;
        }

        // Create the invitation.
        this.addInvitation(invitation);

        // Hook for when an invitation is created.
        await this.onCreateInvitation(invitation);

        // Send the confirmed invitation that was created to both users.
        this.users.sendToUser(invitation.senderID, new InvitationMessage(InvitationMode.CREATE, invitation));
        this.users.sendToUser(invitation.receiverID, new InvitationMessage(InvitationMode.CREATE, invitation));
    }

    public async acceptInvitation(invitation: I): Promise<void> {

        // Accepted invitation must have specified receiverSessionID.
        if (!invitation.receiverSessionID) {
            throw new InvitationError(`Accepted invitation must have receiverSessionID.`);
        }

        // Assert that the invitation is open.
        const foundOpenInvitation = this.getInvitationBySenderReceiver(invitation.senderID, invitation.receiverID);
        if (!foundOpenInvitation) {
            throw new InvitationError(`User ${invitation.senderUsername} has not invited ${invitation.receiverUsername}.`);
        }

        // Remove the invitation from the list of open invitations.
        this.removeInvitation(invitation);

        // Hook for when an invitation is accepted.
        await this.onAcceptInvitation(invitation);

        // Send the accepted invitation to both users.
        this.users.sendToUser(invitation.senderID, new InvitationMessage(InvitationMode.ACCEPT, invitation));
        this.users.sendToUser(invitation.receiverID, new InvitationMessage(InvitationMode.ACCEPT, invitation));
    }

    /**
     * Cancel an open invitation.
     * @param invitation The invitation to cancel.
     * @throws InvitationError if the sender has not invited the receiver, or if the receiver has not been invited by the sender.
     */
    public async cancelInvitation(invitation: I, reason: InvitationCancellationReason): Promise<void> {

        // Remove the invitation from the list of open invitations.
        this.removeInvitation(invitation);

        // Hook for when an invitation is cancelled.
        await this.onCancelInvitation(invitation);

        // Send the cancelled invitation to both users.
        this.users.sendToUser(invitation.senderID, new InvitationMessage(InvitationMode.CANCEL, invitation, reason));
        this.users.sendToUser(invitation.receiverID, new InvitationMessage(InvitationMode.CANCEL, invitation, reason));
    }

    // ------------ Hooks for subclasses optionally to implement ------------

    /**
     * Return an error message if there was an error creating the invitation. By default, no error is returned.
     * @param invitation The invitation that was attempted to be created.
     * @returns An error message, or null if there was no error.
     */
    protected async errorCreatingInvitation(invitation: I): Promise<string | null> { return null; }

    /**
     * Hook for when an invitation is created.
     * @param openInvitation The open invitation that was created.
     */
    protected async onCreateInvitation(invitation: I): Promise<void> {}

    /**
     * Hook for when an invitation is accepted.
     */
    protected async onAcceptInvitation(invitation: I): Promise<void> {}

    /**
     * Hook for when an invitation is cancelled.
     */
    protected async onCancelInvitation(invitation: I): Promise<void> {}


    // ------------ Hooks to be called from InvitationConsumer ------------

    /**
     * If a session is closed and requirement SESSION_NOT_IN_ACTIVITY, cancel all open invitations sent BY that session.
     * @param event The event of the session closing. 
     */
    public async _onSessionDisconnect(event: OnSessionDisconnectEvent): Promise<void> {

        // Only cancel invitations if the requirement is SESSION_NOT_IN_ACTIVITY.
        if (this.invitationRequirement !== InvitationRequirement.SESSION_NOT_IN_ACTIVITY) {
            return;
        }

        // Cancel all open invitations sent by the session.
        const senderID = event.userid;
        const openInvitations = this.invitationsBySender.get(senderID) ?? [];
        for (const openInvitation of openInvitations) {

            // Cancel the invitation if the sender's session is the one that closed.
            if (openInvitation.senderSessionID === event.sessionID) {
                await this.cancelInvitation(openInvitation, InvitationCancellationReason.SENDER_DISCONNECT);
            }
        }
    }

    /**
     * If a user goes offline, cancel all open invitation sent TO that user.
     * @param event The event of the user going offline.
     */
    public async _onUserDisconnect(event: OnUserDisconnectEvent): Promise<void> {

        // Only cancel invitations if the requirement is SESSION_NOT_IN_ACTIVITY.
        if (this.invitationRequirement !== InvitationRequirement.SESSION_NOT_IN_ACTIVITY) {
            return;
        }

        // Cancel all open invitations sent to the user.
        const receiverID = event.userid;
        const openInvitations = this.invitationsByReceiver.get(receiverID) ?? [];
        for (const openInvitation of openInvitations) {
            await this.cancelInvitation(openInvitation, InvitationCancellationReason.RECEIVER_DISCONNECT);
        }
    }

    /**
     * If a user starts an activity and requirement SESSION_NOT_IN_ACTIVITY, cancel all open invitations sent BY OR TO that user.
     * @param event The event of the user starting an activity.
     */
    public async _onUserActivityChange(event: OnUserActivityChangeEvent): Promise<void> {

        // Only cancel invitations if the requirement is SESSION_NOT_IN_ACTIVITY.
        if (this.invitationRequirement !== InvitationRequirement.SESSION_NOT_IN_ACTIVITY) {
            return;
        }

        // If the event was a user STOPPING an activity, not starting one, do nothing.
        if (event.activity === null) {
            return;
        }

        // Cancel all open invitations sent BY the user if they start an activity.
        const senderID = event.userid;
        const openInvitations = this.invitationsBySender.get(senderID) ?? [];
        for (const openInvitation of openInvitations) {
            await this.cancelInvitation(openInvitation, InvitationCancellationReason.SENDER_ACTIVITY_START);
        }

        // Cancel all open invitations sent TO the user if they start an activity.
        const receiverID = event.userid;
        const openInvitationsTo = this.invitationsByReceiver.get(receiverID) ?? [];
        for (const openInvitation of openInvitationsTo) {
            await this.cancelInvitation(openInvitation, InvitationCancellationReason.RECEIVER_ACTIVITY_START);
        }
    }

}