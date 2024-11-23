import { DBUserObject } from "../../database/db-objects/db-user";
import { EventConsumer } from "../event-consumer";
import { OnUserDisconnectEvent } from "../online-user-events";

/**
 * Consumer for handling guests. On guest disconnect, delete the guest user from the database.
 */
export class GuestConsumer extends EventConsumer {

    protected override async onUserDisconnect(event: OnUserDisconnectEvent) {

        // Get the user object for the disconnected user
        const user = (await DBUserObject.get(event.userid)).object;

        // Ignore if user is not a guest
        if (!user.is_guest) return;

        // Delete the user from the database
        await DBUserObject.delete(event.userid);
    }
}