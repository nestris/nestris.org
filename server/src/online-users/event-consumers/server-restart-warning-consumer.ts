import { ServerRestartWarningMessage } from "../../../shared/network/json-message";
import { EventConsumer } from "../event-consumer";
import { OnSessionConnectEvent, OnUserDisconnectEvent } from "../online-user-events";

/**
 * Consumer for toggling server restarts and notifying users
 */
export class ServerRestartWarningConsumer extends EventConsumer {

    private serverRestartWarning: boolean = false;

    public override init() {
        console.log(`Server restart warning initialized to ${this.serverRestartWarning}`);
    }

    /**
     * Toggle the server restart warning and notify all online users
     */
    public toggleServerRestartWarning() {
        this.serverRestartWarning = !this.serverRestartWarning;
        this.users.sendToAllOnlineUsers(new ServerRestartWarningMessage(this.serverRestartWarning));
        console.log(`Server restart warning set to ${this.serverRestartWarning}`);
    }

    /**
     * On session connect, send the current server restart warning status if it is active
     * @param event The session connect event
     */
    protected override async onSessionConnect(event: OnSessionConnectEvent): Promise<void> {
        if (this.serverRestartWarning) {
            this.users.sendToUserSession(event.sessionID, new ServerRestartWarningMessage(true));
        }
    }
}