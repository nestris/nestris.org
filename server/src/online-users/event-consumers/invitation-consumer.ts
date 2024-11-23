import { EventConsumer } from "../event-consumer";
import { OnlineUserManager } from "../online-user-manager";
import { v4 as uuid } from 'uuid';
import { NotificationType } from "../../../shared/models/notifications";
import { UserSessionID } from "../online-user";
import { OnlineUserActivityType } from "../../../shared/models/activity";
import { InvitationManager } from "../../invitations/invitation";


/**
 * Consumer for handling creating, accepting, and cancelling invitations.
 */
export class InvitationConsumer extends EventConsumer {

    // Map of InvitationManager names to InvitationManager instances
    private readonly invitationManagers: Map<string, InvitationManager> = new Map();

    public async registerInvitationManager(invitationManagerClass: new (users: OnlineUserManager) => InvitationManager) {

        // Assert InvitationManager is not already registered
        if (this.invitationManagers.has(invitationManagerClass.name)) {
            throw new Error(`InvitationManager ${invitationManagerClass.name} is already registered`);
        }

        // Create the InvitationManager instance
        const invitationManager = new invitationManagerClass(this.users);

        // Register InvitationManager
        this.invitationManagers.set(invitationManagerClass.name, invitationManager);

        console.log(`Registered InvitationManager: ${invitationManagerClass.name}`);
    }

}