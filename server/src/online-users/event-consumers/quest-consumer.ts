import { QuestCompleteMessage } from "../../../shared/network/json-message";
import { DBUserObject, JustCompletedQuest } from "../../database/db-objects/db-user";
import { EventConsumer } from "../event-consumer";

/**
 * Consumer for handling completed quests and notifying the user of it.
 */
export class QuestConsumer extends EventConsumer {

    public override init() {

        // If the session is online, send the user a message that they have completed a quest
        DBUserObject.onCompleteQuest().subscribe((quest: JustCompletedQuest) => {

            const sent = this.users.sendToUserSession(quest.sessionid, new QuestCompleteMessage(quest.questName));

            if (!sent) {
                console.warn(`User ${quest.userid} completed quest ${quest.questName} but was not online to receive the message`);
            }
        });

    }
}