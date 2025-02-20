import { QuestCompleteMessage } from "../../../shared/network/json-message";
import { EventConsumer, EventConsumerManager } from "../event-consumer";
import { DBQuestProgressEvent, DBUserObject } from "../../database/db-objects/db-user";
import { getQuestStatus, QuestCategory, QuestID, QUESTS } from "../../../shared/nestris-org/quest-system";
import { ActivityConsumer } from "./activity-consumer";
import { ActivityType } from "../../../shared/models/activity";

// Sort quest IDs first by category, then by descending xp gain.
// This means that when traversing QuestIDs, it is guaranteed that harder quests will be encountered first
const QuestIDs = Object.values(QuestID).filter(id => typeof id === 'number') as QuestID[];
QuestIDs.sort((a, b) => {
    const questA = QUESTS[a];
    const questB = QUESTS[b];
    if (questA.category === questB.category) return questB.xp - questA.xp;
    if (questA.category === undefined) return 1;
    if (questB.category === undefined) return -1;
    return questA.category.localeCompare(questB.category);
});
console.log(QuestIDs.map(id => QUESTS[id].name));

// Handles events related to quests
export class QuestConsumer extends EventConsumer {

    override async init() {

        // Set some default quest values when a user is created
        DBUserObject.onCreate().subscribe(({ id: userid , object: dbUser }) => {

            // Users start with some positive trophy count, so update Champion quests which have trophy targets
            this.updateChampionQuestCategory(userid, dbUser.wins, dbUser.highest_trophies);
        });
    }

    /**
     * Check for quest progress updates for each quest in a given category. If progress results in multiple quests being completed
     * at once, only the highest score quest will display a message to the user
     * @param category The category to check for quest progress updates
     * @param progress If a number, the value to set progress to. If a function, the function to call to get progress value for each quest
     */
    public async updateQuestCategory(
        userid: string,
        category: QuestCategory,
        progress: number | ((questID: QuestID) => number),
        allowNegativeProgress: boolean = false,
    ) {

        // Get the existing quest progress for the user
        const questProgress = [...(await DBUserObject.get(userid)).quest_progress];

        // Update quest progress for each quest in the category
        // Iterate through all quests in the category in descending order of xp gain
        let progressMade = false;
        let completedQuestIDs: QuestID[] = [];
        for (const questID of QuestIDs) {
            const quest = QUESTS[questID];
            if (quest.category !== category) continue;

            // Get previous and new progress for the quest
            const previousStatus = getQuestStatus(questProgress, questID);
            const newProgress = typeof progress === 'number' ? progress : progress(questID);

            // if progress made, update quest progress
            if (newProgress > previousStatus.currentScore) {
                questProgress[questID] = newProgress;
                progressMade = true;

                // if newly completed quest, mark as completed to add xp and display alert
                if (!previousStatus.completed && newProgress >= quest.targetScore) completedQuestIDs.push(questID);
            }

            if (allowNegativeProgress && newProgress < previousStatus.currentScore) {
                questProgress[questID] = newProgress;
                progressMade = true;
            }
        }

        // If no progress was made, do nothing
        if (!progressMade) return;

        // Fill in any gaps in quest progress with 0
        for (const questID of QuestIDs) {
            if (questProgress[questID] === undefined) questProgress[questID] = 0;
        }

        // Calculate how much xp was gained from completing quests
        const xpGained = completedQuestIDs.reduce((total, questID) => total + QUESTS[questID].xp, 0);
        console.log(`${userid}: Completed quests: ${completedQuestIDs.map(id => QUESTS[id].name)} for ${xpGained} xp`);

        // Update the quest progress in the database
        await DBUserObject.alter(userid, new DBQuestProgressEvent({ questProgress, xpGained }), false);

        // If there was at least one quest completed, send a message to the user for the hardest quest completed
        if (completedQuestIDs.length > 0) this.users.sendToUser(userid, new QuestCompleteMessage(completedQuestIDs[0]));

        // Add activity for each quest completed, from easiest to hardest. Do in sequential order, without blocking this function
        const addQuestCompletionActivities = async () => {
            const activityConsumer = EventConsumerManager.getInstance().getConsumer(ActivityConsumer);
            for (let questID of completedQuestIDs.slice().reverse()) {
                await activityConsumer.createActivity(userid, { type: ActivityType.QUEST_COMPLETION, questID });
            }
        }
        if (completedQuestIDs.length > 0) addQuestCompletionActivities();

    }

    public async updateChampionQuestCategory(userid: string, wins: number, trophies: number) {

        await this.updateQuestCategory(userid, QuestCategory.CHAMPION, (questID: QuestID) => {

            // Champion I is the number of matches won
            if (questID === QuestID.CHAMPION_I) return wins;

            // Champion II+ are trophy count
            return trophies;
        });
    }
}