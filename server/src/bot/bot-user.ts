import { v4 as uuidv4 } from 'uuid';
import { DBUserObject } from '../database/db-objects/db-user';
import { Authentication, DBUser, LoginMethod } from '../../shared/models/db-user';
import { generateRandomUsername } from '../authentication/username-generation';
import { JsonMessage } from '../../shared/network/json-message';
import { OnlineUserManager } from '../online-users/online-user-manager';
import { PacketDisassembler } from '../../shared/network/stream-packets/packet-disassembler';
import { BotOnlineUserSession } from '../online-users/online-user';
import { EventConsumerManager } from '../online-users/event-consumer';

/**
 * Create a new bot user with the given ID, generating a random username for the bot.
 * @param userid The ID of the bot user. Precondition: The user does not already exist in the database.
 * @returns The newly created bot user.
 */
export async function createBotUser(userid: string): Promise<DBUser> {

    const username = await generateRandomUsername();
    
    // Create new user
    console.log(`Creating new user ${username} with ID ${userid} (BOT USER)`);
    const user = await DBUserObject.create(userid, {
        username: username,
        login_method: LoginMethod.BOT,
        authentication: Authentication.USER
    });

    return user;
}


export class BotUser {
    protected eventManager: EventConsumerManager;
    protected users: OnlineUserManager;
    
    public readonly sessionID = uuidv4();

    private _username!: string;
    public get username() { return this._username; }

    private _session?: BotOnlineUserSession;
    public get session() { return this._session; }

    constructor(
        public readonly userid: string
    ) {
        this.eventManager = EventConsumerManager.getInstance();
        this.users = this.eventManager.getUsers();
    }

    /**
     * Initialize the bot by checking if the bot user exists in the database, and creating it if it does not.
     * This connects the bot to the server and makes the bot online.
     */
    public async init() {
        
        // Get the bot user from the database, or create it if it does not exist
        let botUser = await DBUserObject.getOrNull(this.userid);
        if (!botUser) botUser = await createBotUser(this.userid);
        else console.log(`Loaded existing bot user ${botUser.username} with ID ${this.userid}`);
        
        // Assert that the user is a bot user
        if (botUser.login_method !== LoginMethod.BOT) {
            throw new Error(`User ${this.userid} is not a bot user`);
        }

        // Assign the username
        this._username = botUser.username;

        // Call the start() hook but don't wait for it to finish
        console.log(`Bot user ${this.username} with userid ${this.userid} initialized, starting...`);
        this.start();
    }

    /**
     * Connect the bot to the server. This makes the bot online and binds the bot to session.
     */
    protected connect() {
        if (this._session) throw new Error(`Bot user ${this.username} is already connected`);
        this._session = this.users.onBotConnect(this);
        console.log(`Bot user ${this.username} connected with ID ${this.userid}`);
    }

    /**
     * Deinitialize the bot. This disconnects the bot from the server and makes the bot offline.
     */
    protected disconnect() {
        if (!this._session) throw new Error(`Bot user ${this.username} is already disconnected`);
        this.users.onBotDisconnect(this);
        this._session = undefined;
        console.log(`Bot user ${this.username} disconnected with ID ${this.userid}`);
    }

    /**
     * Override this method to implement what to do after the bot is initialized. Likely, this should
     * connect the bot to the server at some point.
     */
    protected async start() {}

    /**
     * Handle when a JSON message is received from the server.
     * @param message The JSON message received from the server
     */
    public async onJsonMessageFromServer(message: JsonMessage): Promise<void> {}

    /**
     * Handle when a binary message is received from the server.
     * @param message The binary message received from the server
     */
    public async onBinaryMessageFromServer(message: Uint8Array): Promise<void> {}


    /**
     * Send a JSON message to the server.
     * @param message The JSON message to send to the server
     */
    protected sendJsonMessageToServer(message: JsonMessage) {
        console.log(`Sending message from bot ${this.username} to server: ${JSON.stringify(message)}`);
        this.users.onBotMessage(this, message);
    }

    /**
     * Send a binary message to the server.
     * @param message The binary message to send to the server
     */
    protected sendBinaryMessageToServer(message: Uint8Array) {
        this.users.onBotMessage(this, new PacketDisassembler(message, false));
    }
}

