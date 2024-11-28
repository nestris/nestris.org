import { MeMessage } from "../../../shared/network/json-message";
import { EventConsumer } from "../event-consumer";
import { DBUserObject } from "../../database/db-objects/db-user";

// When a DBUser object changes, send MeMessage to all online sessions of the user
export class MeConsumer extends EventConsumer {

    public override init() {
        DBUserObject.onChange().subscribe(async ({ id: userid,  after: dbUser }) => {
            this.users.sendToUser(userid, new MeMessage(dbUser));
        });
    }
}