import { JsonMessageType } from "../../../shared/network/json-message";
import { EventConsumer } from "../event-consumer";
import { OnSessionJsonMessageEvent } from "../online-user-events";

/**
 * Consumer for handling ping events. Echoes back the ping message to the user.
 */
export class PingConsumer extends EventConsumer {

    protected async onSessionJsonMessage(event: OnSessionJsonMessageEvent) {
        if (event.message.type === JsonMessageType.PING) {
            this.users.sendToUserSession(event.userid, event.sessionID, event.message);
        }
    }
}