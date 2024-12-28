import { Authentication } from "../../../shared/models/db-user";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { ServerRestartWarningConsumer } from "../../online-users/event-consumers/server-restart-warning-consumer";
import { SoloRoom } from "../../room/solo-room";
import { PostRoute, UserInfo } from "../route";

/**
 * Toggle the server restart warning
 */
export class SetServerRestartWarningRoute extends PostRoute {
    route = "/api/v2/server-restart-warning";
    authentication = Authentication.ADMIN;

    override async post(userInfo: UserInfo | undefined) {
        
        // Toggle the server restart warning and notify all online users
        EventConsumerManager.getInstance().getConsumer(ServerRestartWarningConsumer).toggleServerRestartWarning();

        return {success: true};
    }
}