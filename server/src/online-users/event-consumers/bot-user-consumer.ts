import { sleep } from "../../../shared/scripts/sleep";
import { BotUser } from "../../bot/bot-user";
import { EventConsumer } from "../event-consumer";

const BOT_ID = 'bot';

/**
 * Manages all the bot users, which should be online for the entire duration of the server.
 */
export class BotUserConsumer extends EventConsumer {

    // Map of bot user ID to bot user
    private bots = new Map<string, BotUser>();

    public override async init(): Promise<void> {

        // start testing bot without blocking
        this.testBot();
    }

    /**
     * Connect a bot user to the server.
     * @param botUserID The userid of the bot user to connect. If the userid already exists, it must be a bot user.
     */
    public async connectBot(botUserID: string) {
        const bot = new BotUser(this.users, botUserID);
        await bot.init();
        this.bots.set(botUserID, bot);
    }

    /**
     * Disconnect a bot user from the server.
     * @param botUserID The userid of the bot user to disconnect.
     */
    public async disconnectBot(botUserID: string) {
        const bot = this.bots.get(botUserID);
        if (!bot) {
            console.error(`Cannot disconnect bot ${botUserID} because it is not connected`);
            return;
        }
        bot.deinit();
        this.bots.delete(botUserID);
    }

    public async testBot() {

        for (let i = 0; i < 10; i++) {
            await this.connectBot(BOT_ID);
            await sleep(8000);
            await this.disconnectBot(BOT_ID);
            await sleep(8000);
        }
    }
}