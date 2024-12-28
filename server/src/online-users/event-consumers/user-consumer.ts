import { MeMessage } from "../../../shared/network/json-message";
import { EventConsumer } from "../event-consumer";
import { DBUserObject, DBUserOnlineEvent } from "../../database/db-objects/db-user";
import { OnSessionConnectEvent } from "../online-user-events";


// Handles events related to users
export class UserConsumer extends EventConsumer {

    public override init() {
        // When a DBUser object changes, send MeMessage to all online sessions of the user
        DBUserObject.onChange().subscribe(async ({ id: userid,  after: dbUser }) => {
            this.users.sendToUser(userid, new MeMessage(dbUser));
        });
    }

    protected override async onSessionConnect(event: OnSessionConnectEvent): Promise<void> {
        // When user connects, update user's last online time
        await DBUserObject.alter(event.userid, new DBUserOnlineEvent(), false);
    }

}