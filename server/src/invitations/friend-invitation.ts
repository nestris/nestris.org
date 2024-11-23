import { Invitation, InvitationType } from "../../shared/models/invitation";
import { InvitationManager, InvitationRequirement } from "./invitation";

/**
 * Manager for handling friend requests. They can be sent at any time. There is no additional metadata required beyond Invitation.
 */
export class FriendInvitationManager extends InvitationManager<Invitation> {

    // This manager handles friend requests
    public readonly invitationType = InvitationType.FRIEND_REQUEST;

    // Friend requests can be sent at any time
    protected readonly invitationRequirement = InvitationRequirement.NONE;
}