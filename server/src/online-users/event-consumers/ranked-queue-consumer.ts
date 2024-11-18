import { DBUserObject } from "../../database/db-objects/db-user";
import { EventConsumer } from "../event-consumer";


/**
 * QUEUE REQUIREMENTS
 * 
 * Expanding trophy range window
 * No rematches for last N opponents
 * Maximum wait threshold to match with anyone (AI?)
 * 
 */

class QueueUser {

    public readonly queueStartTime = Date.now();

    constructor(
        public readonly userid: string,
        public readonly username: string,
        public readonly sessionID: string,
        public readonly trophies: number,
    ) {}

    // Returns the time elapsed since the user was added to the queue
    public queueElapsedTime(): number {
        return Date.now() - this.queueStartTime;
    }
}

/**
 * Consumer for handling guests. On guest disconnect, delete the guest user from the database.
 */
export class RankedQueueConsumer extends EventConsumer {

    private queue: QueueUser[] = [];

    public async joinRankedQueue(sessionid: string) {

        // Get userid from sessionid
        const userid = this.users.getUserIDBySessionID(sessionid);
        if (!userid) throw new Error(`Session ID ${sessionid} is not connected to a user`);

        // Get user object from database
        const user = (await DBUserObject.get(userid)).object;

        // Add user to the queue
        this.queue.push(new QueueUser(userid, user.username, sessionid, user.trophies));

    }

}