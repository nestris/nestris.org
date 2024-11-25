import { Invitation, InvitationType } from "../../shared/models/invitation";
import { EventConsumerManager } from "../online-users/event-consumer";
import { FriendEventConsumer } from "../online-users/event-consumers/friend-event-consumer";
import { InvitationManager, InvitationRequirement } from "./invitation";

/**
 * Manager for handling friend requests. They can be sent at any time. There is no additional metadata required beyond Invitation.
 */
export class FriendInvitationManager extends InvitationManager<Invitation> {

    // This manager handles friend requests
    public readonly invitationType = InvitationType.FRIEND_REQUEST;

    // Friend requests can be sent at any time
    protected readonly invitationRequirement = InvitationRequirement.NONE;

    /**
     * When a friend request is accepted, the sender and receiver become friends.
     * @param invitation The friend request to accept
     */
    protected override async onAcceptInvitation(invitation: Invitation): Promise<void> {

        // Add the friend relationship between the sender and receiver
        const friendEventConsumer = EventConsumerManager.getInstance().getConsumer(FriendEventConsumer);
        await friendEventConsumer.addFriend(invitation.senderID, invitation.receiverID);

        console.log(`Created friend relationship between ${invitation.senderID} and ${invitation.receiverID}`);
    }

}