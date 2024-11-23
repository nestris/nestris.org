import { Authentication } from "../../../shared/models/db-user";
import { Invitation } from "../../../shared/models/invitation";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { InvitationConsumer } from "../../online-users/event-consumers/invitation-consumer";
import { GetRoute, UserInfo } from "../route";

/**
 * Route for getting all open invitations for the logged in user
 */
export class GetInvitationsRoute extends GetRoute<Invitation[]> {
    route = "/api/v2/invitations";
    authentication = Authentication.USER;

    override async get(userInfo: UserInfo | undefined) {

        const invitationConsumer = EventConsumerManager.getInstance().getConsumer(InvitationConsumer);
        return invitationConsumer.getOpenInvitationsForUser(userInfo!.userid);

    }
}