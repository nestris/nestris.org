import { MeMessage } from "../../../shared/network/json-message";
import { EventConsumer, EventConsumerManager } from "../event-consumer";
import { DBUserObject, DBUserOnlineEvent } from "../../database/db-objects/db-user";
import { OnSessionConnectEvent } from "../online-user-events";
import { ActivityConsumer } from "./activity-consumer";
import { ActivityType } from "../../../shared/models/activity";


// Handles events related to users
export class UserConsumer extends EventConsumer {

    public override async init() {
        DBUserObject.onChange().subscribe(async ({ id: userid, before: beforeUser, after: afterUser }) => {

            // When a DBUser object changes, send MeMessage to all online sessions of the user
            this.users.sendToUser(userid, new MeMessage(afterUser));

            // On promotion, log activity
            if (afterUser.league > beforeUser.league) {
                const activityConsumer = EventConsumerManager.getInstance().getConsumer(ActivityConsumer);
                activityConsumer.createActivity(userid, { type: ActivityType.LEAGUE_PROMOTION, league: afterUser.league });
            }
        });
    }

    protected override async onSessionConnect(event: OnSessionConnectEvent): Promise<void> {
        // When user connects, update user's last online time
        await DBUserObject.alter(event.userid, new DBUserOnlineEvent(), false);
    }

}