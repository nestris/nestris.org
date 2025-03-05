import { EventConsumer } from "../event-consumer";
import { OnUserConnectEvent, OnUserDisconnectEvent } from "../online-user-events";

/**
 * Consumer for handling guests. On guest disconnect, delete the guest user from the database.
 */
export class GuestConsumer extends EventConsumer {

}