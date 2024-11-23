import { EventConsumer } from "../event-consumer";
import { OnlineUserManager } from "../online-user-manager";
import { v4 as uuid } from 'uuid';
import { NotificationType } from "../../../shared/models/notifications";
import { UserSessionID } from "../online-user";
import { OnlineUserActivityType } from "../../../shared/models/activity";
import { InvitationError, InvitationManager } from "../../invitations/invitation";
import { OnSessionDisconnectEvent, OnSessionJsonMessageEvent, OnUserActivityChangeEvent, OnUserDisconnectEvent } from "../online-user-events";
import { InvitationMessage, InvitationMode, JsonMessageType, SendPushNotificationMessage } from "../../../shared/network/json-message";
import { Invitation, InvitationCancellationReason, InvitationType } from "../../../shared/models/invitation";


/**
 * Consumer for handling creating, accepting, and cancelling invitations.
 */
export class InvitationConsumer extends EventConsumer {

    // Map of Invitation type to InvitationManager instance
    private readonly invitationManagers: Map<InvitationType, InvitationManager> = new Map();

    /**
     * Register an InvitationManager class to be used by the InvitationConsumer.
     * @param invitationManagerClass The InvitationManager class to register
     */
    public async registerInvitationManager(invitationManagerClass: new (users: OnlineUserManager) => InvitationManager) {

        // Create the InvitationManager instance
        const invitationManager = new invitationManagerClass(this.users);

        // Assert InvitationManager type is not already registered
        if (this.invitationManagers.has(invitationManager.invitationType)) {
            throw new Error(`InvitationManager of type ${invitationManager.invitationType} is already registered`);
        }
        
        // Register InvitationManager
        this.invitationManagers.set(invitationManager.invitationType, invitationManager);

        console.log(`Registered InvitationManager: ${invitationManager.invitationType}`);
    }

    /**
     * Get the open invitations sent to or sent by the user with the given userid.
     * @param userid 
     */
    public getOpenInvitationsForUser(userid: string): Invitation[] {

        // Iterate through all InvitationManagers to aggregate open invitations
        const openInvitations: Invitation[] = [];
        for (const [_, invitationManager] of this.invitationManagers) {
            openInvitations.push(...invitationManager.getOpenInvitationsForUser(userid));
        }
        return openInvitations;
    }

    /**
     * On an INVITATION event from the client, handle the invitation for the corresponding InvitationManager.
     * @param event The session json message event
     */
    protected override async onSessionJsonMessage(event: OnSessionJsonMessageEvent): Promise<void> {

        // Only handle INVITATION events
        if (event.message.type !== JsonMessageType.INVITATION) return;
        const { mode, invitation, cancelReason } = (event.message as InvitationMessage);

        // Get the corresponding InvitationManager for the invitation type
        const invitationManager = this.invitationManagers.get(invitation.type);
        if (!invitationManager) {
            console.error(`No InvitationManager registered for invitation type ${invitation.type}`);
            return;
        }

        // Handle the invitation based on the mode
        try {
            switch (mode) {
                case InvitationMode.CREATE:
                    invitationManager.createInvitation(invitation);
                    break;
                case InvitationMode.ACCEPT:
                    invitation.receiverSessionID = event.sessionID;
                    invitationManager.acceptInvitation(invitation);
                    break;
                case InvitationMode.CANCEL:
                    let cancelReason: InvitationCancellationReason;
                    if (event.userid === invitation.senderID) {
                        cancelReason = InvitationCancellationReason.SENDER_CANCEL;
                    } else {
                        cancelReason = InvitationCancellationReason.RECEIVER_DECLINE
                    };
                    invitationManager.cancelInvitation(invitation, cancelReason);
            }
        } catch (error) {
            if (error instanceof InvitationError) {
                if (error.sendError) {
                    this.users.sendToUserSession(event.sessionID, new SendPushNotificationMessage(
                        NotificationType.ERROR, error.message
                    ));
                } else console.error(error.message);
            } else console.error(error);
        }
    }

    /**
     * On session disconnect, notify all invitation managers to cancel any pending invitations.
     * @param event The session disconnect event
     */
    protected override async onSessionDisconnect(event: OnSessionDisconnectEvent): Promise<void> {
        for (const [_, invitationManager] of this.invitationManagers) {
            invitationManager._onSessionDisconnect(event);
        }
    }

    /**
     * On user disconnect, notify all invitation managers to cancel any pending invitations.
     * @param event The user disconnect event
     */
    protected override async onUserDisconnect(event: OnUserDisconnectEvent): Promise<void> {
        for (const [_, invitationManager] of this.invitationManagers) {
            invitationManager._onUserDisconnect(event);
        }
    }

    /**
     * On user activity change, notify all invitation managers of the activity change.
     * @param event The user activity change event
     */
    protected override async onUserActivityChange(event: OnUserActivityChangeEvent): Promise<void> {
        for (const [_, invitationManager] of this.invitationManagers) {
            invitationManager._onUserActivityChange(event);
        }
    }

}