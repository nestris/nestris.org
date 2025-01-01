import { OnlineUserManager } from "../online-users/online-user-manager";
import { BotUser } from "./bot-user";

export class BotManager {

    // Maps bot user ID to BotUser
    private bots: Map<string, BotUser> = new Map();
    
    /**
     * Register a bot with the bot manager. This does not automatically connect the bot to the server.
     * @param bot The bot to register
     */
    public registerBot(bot: BotUser) {
        this.bots.set(bot.userid, bot);
    }

    /**
     * Initialize all bots in parallel. This does not automatically connect the bots to the server. Each
     * bot must call connect() to connect to the server.
     */
    public async init() {
        await Promise.all(Array.from(this.bots.values()).map(bot => bot.init()));
    }
}