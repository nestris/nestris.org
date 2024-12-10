import { getLeagueFromIndex } from "../../../shared/nestris-org/league-system";
import { FoundOpponentMessage, NumQueuingPlayersMessage, RedirectMessage, SendPushNotificationMessage } from "../../../shared/network/json-message";
import { TrophyDelta } from "../../../shared/room/multiplayer-room-models";
import { sleep } from "../../../shared/scripts/sleep";
import { DBUserObject } from "../../database/db-objects/db-user";
import { RankedMultiplayerRoom } from "../../room/ranked-multiplayer-room";
import { EventConsumer, EventConsumerManager } from "../event-consumer";
import { OnSessionDisconnectEvent } from "../online-user-events";
import { RoomAbortError, RoomConsumer } from "./room-consumer";
import { NotificationType } from "../../../shared/models/notifications";
import { OnlineUserActivityType } from "../../../shared/models/activity";
import { DBUser } from "../../../shared/models/db-user";
import { getEloChange } from "../../../shared/nestris-org/elo-system";

export class QueueError extends Error {}
export class UserUnavailableToJoinQueueError extends QueueError {}

/**
 * Represents a range of trophies that a user can be matched with
 */
class TrophyRange {

    /**
     * Create a trophy range with a delta from the given number of trophies
     * @param trophies The number of trophies
     * @param delta The range of trophies to include on either side of the given number of trophies
     * @returns A trophy range with the given number of trophies and delta
     */
    static fromDelta(trophies: number, delta: number): TrophyRange {
        return new TrophyRange(trophies - delta, trophies + delta);
    }
    
    /**
     * Create a trophy range with the given min and max values
     * @param min The minimum number of trophies, or null if there is no minimum
     * @param max The maximum number of trophies, or null if there is no maximum
     */
    constructor(
        public readonly min: number | null,
        public readonly max: number | null,
    ) {}

    /**
     * Check if the given number of trophies is within the range
     * @param trophies The number of trophies to check
     * @returns True if the number of trophies is within the range, false otherwise
     */
    public contains(trophies: number): boolean {
        return (this.min === null || trophies >= this.min) && (this.max === null || trophies <= this.max);
    }
}

/**
 * Represents a user in the ranked queue
 */
class QueueUser {

    public readonly queueStartTime = Date.now();

    constructor(
        public readonly userid: string,
        public readonly username: string,
        public readonly sessionID: string,
        public readonly trophies: number,
    ) {}

    /**
     * Get the time elapsed since the user was added to the queue in seconds
     * @returns The time elapsed since the user was added to the queue in seconds
     */
    public queueElapsedSeconds(): number {
        return (Date.now() - this.queueStartTime) / 1000;
    }

    /**
     * Calculate opponent trophy range for user based on the user's trophies and queue time
     */
    public getTrophyRange(): TrophyRange {

        // Time elapsed since user was added to the queue in seconds
        const queueTime = this.queueElapsedSeconds();

        // FOR BETA, MATCH QUICKLY
        if (queueTime < 3) return TrophyRange.fromDelta(this.trophies, 200);
        if (queueTime < 6) return TrophyRange.fromDelta(this.trophies, 600);
        return new TrophyRange(null, null);

        // Calculate trophy range based on queue time
        if (queueTime < 3) return TrophyRange.fromDelta(this.trophies, 100);
        if (queueTime < 5) return TrophyRange.fromDelta(this.trophies, 200);
        if (queueTime < 10) return TrophyRange.fromDelta(this.trophies, 400);
        if (queueTime < 20) return TrophyRange.fromDelta(this.trophies, 1000);
        return new TrophyRange(null, null);
    }

}

/**
 * Consumer for handling guests. On guest disconnect, delete the guest user from the database.
 */
export class RankedQueueConsumer extends EventConsumer {

    private queue: QueueUser[] = [];

    // Map of previous opponent's userid for each userid, used to discourage rematches     
    private previousOpponent: Map<string, string> = new Map();

    public override init(): void {

        // Find matches every second
        setInterval(() => this.findMatches(), 1000);
    }

    /**
     * Get the number of players in the queue
     * @returns The number of players in the queue
     */
    public playersInQueue(): number {
        return this.queue.length;
    }

    /**
     * When a session disconnects, remove the user from the queue if the user's session is the one that disconnected
     * @param event The session disconnect event
     */
    protected override async onSessionDisconnect(event: OnSessionDisconnectEvent): Promise<void> {

        // Get the QueueUser corresponding to the session that disconnected
        const queueUser = this.getQueueUser(event.userid);
        if (!queueUser) return;
        if (queueUser.sessionID !== event.sessionID) return;

        // Remove the user from the queue
        this.leaveRankedQueue(event.userid);
    }

    /**
     * Add a user to the ranked queue
     * @param sessionID The session ID of the user to add to the queue
     * @throws UserUnavailableToJoinQueueError if the user is unavailable to join the queue
     */
    public async joinRankedQueue(sessionID: string) {

        // Get userid from sessionid
        const userid = this.users.getUserIDBySessionID(sessionID);
        if (!userid) throw new Error(`Session ID ${sessionID} is not connected to a user`);

        // If user is already in the queue
        const existingQueueUser = this.getQueueUser(userid);
        if (existingQueueUser) {

            // If user is already in the queue with the same sessionid, do nothing
            if (existingQueueUser.sessionID === sessionID) return;

            // If user is trying to join the queue with a different sessionid, throw an error
            throw new UserUnavailableToJoinQueueError(`User ${userid} is already in the queue with a different session`);
        }

        // Check that user is available to join the queue
        if (this.users.isUserInActivity(userid)) throw new UserUnavailableToJoinQueueError(`User ${userid} is already in an activity`);

        // Set user's activity as in the queue
        this.users.setUserActivity(sessionID, OnlineUserActivityType.QUEUEING);

        // Get user object from database
        const dbUser = await DBUserObject.get(userid);

        // Add user to the queue, maintaining earliest-joined-first order
        this.queue.push(new QueueUser(userid, dbUser.username, sessionID, dbUser.trophies));

        // Send the number of players in the queue to all users in the queue
        this.sendNumQueuingPlayers();

        console.log(`User ${userid} joined the ranked queue`);
    }

    /**
     * Remove a user from the ranked queue
     * @param userid The userid of the user to remove from the queue
     */
    public async leaveRankedQueue(userid: string) {

        // if user is not in the queue, do nothing
        if (!this.getQueueUser(userid)) return;

        // Remove user from the queue
        this.queue = this.queue.filter(user => user.userid !== userid);

        // Reset user's activity
        this.users.resetUserActivity(userid);

        // Send the number of players in the queue to all users in the queue
        this.sendNumQueuingPlayers();

        console.log(`User ${userid} left the ranked queue`);
    }

    /**
     * Get the QueueUser corresponding to a userid
     * @param userid The userid to get the QueueUser for
     * @returns 
     */
    private getQueueUser(userid: string): QueueUser | undefined {
        return this.queue.find(user => user.userid === userid);
    }

    /**
     * Find matches between users in the queue
     */
    private findMatches() {

        // We find matches by iterating through the queue earliest-joined-first
        // and trying to match each user with another user in the queue
        for (let i = 0; i < this.queue.length; i++) {
            const user1 = this.queue[i];
            for (let j = i + 1; j < this.queue.length; j++) {
                const user2 = this.queue[j];

                // Check if the users meet the criteria to be matched
                if (this.canMatch(user1, user2)) {

                    // if so, match the users. This will also remove the users from the queue
                    this.match(user1, user2);

                    // Find any other matches that can be made
                    this.findMatches();
                    return;
                }
            }
        }
    }

    /**
     * Check if two users meet the criteria to be matched
     * @param user1 The first user in the potential match
     * @param user2 The second user in the potential match
     */
    private canMatch(user1: QueueUser, user2: QueueUser): boolean {

        // Check if the users are not the same
        if (user1.userid === user2.userid) return false;

        // If either player has not been in the queue for at least one second, they cannot be matched
        if (user1.queueElapsedSeconds() < 1) return false;
        if (user2.queueElapsedSeconds() < 1) return false;

        // Check if the users have similar trophies
        if (!user1.getTrophyRange().contains(user2.trophies)) return false;
        if (!user2.getTrophyRange().contains(user1.trophies)) return false;

        // Check if the users have not played each other before, unless both users have been waiting for a long time
        const MAX_WAIT_TIME = 2; // If both users have been waiting for more than MAX_WAIT_TIME seconds, they can rematch
        if (user1.queueElapsedSeconds() < MAX_WAIT_TIME && user2.queueElapsedSeconds() < MAX_WAIT_TIME) {
            if (this.previousOpponent.get(user1.userid) === user2.userid) return false;
            if (this.previousOpponent.get(user2.userid) === user1.userid) return false;
        }

        // If all criteria are met, the users can be matched
        return true;
    }

    /**
     * Calculate the win/loss trophy delta for two users after a match
     * @param user1 The first user in the match
     * @param user2 The second user in the match
     */
    private async calculateTrophyDelta(user1: DBUser, user2: DBUser): Promise<{
        player1TrophyDelta: TrophyDelta,
        player2TrophyDelta: TrophyDelta,
    }> {

        const elo1 = user1.trophies;
        const elo2 = user2.trophies;
        const numMatches1 = user1.matches_played;
        const numMatches2 = user2.matches_played;

        // use the elo system to calculate the win/loss trophy delta for each user
        return {
            player1TrophyDelta: {
                trophyGain: getEloChange(elo1, elo2, 1, numMatches1),
                trophyLoss: getEloChange(elo1, elo2, 0, numMatches1),
            },
            player2TrophyDelta: {
                trophyGain: getEloChange(elo2, elo1, 1, numMatches2),
                trophyLoss: getEloChange(elo2, elo1, 0, numMatches2),
            }
        };
    }

    /**
     * Match two users in the queue
     * @param user1 
     * @param user2 
     */
    private async match(user1: QueueUser, user2: QueueUser) {

        // Remove users from the queue before awaiting the match
        this.queue = this.queue.filter(user => user !== user1 && user !== user2);

        // Set the previous opponent for each user to the other user
        this.previousOpponent.set(user1.userid, user2.userid);
        this.previousOpponent.set(user2.userid, user1.userid);

        const [dbUser1, dbUser2] = await Promise.all([
            DBUserObject.get(user1.userid),
            DBUserObject.get(user2.userid),
        ]);

        // Calculate the win/loss XP delta for the users
        const { player1TrophyDelta, player2TrophyDelta } = await this.calculateTrophyDelta(dbUser1, dbUser2);

        // Send the message that an opponent has been found to both users
        const player1League = getLeagueFromIndex(dbUser1.league);
        const player2League = getLeagueFromIndex(dbUser2.league);
        this.users.sendToUserSession(user1.sessionID, new FoundOpponentMessage(
            user2.username, user2.trophies, player2League, player1TrophyDelta
        ));
        this.users.sendToUserSession(user2.sessionID, new FoundOpponentMessage(
            user1.username, user1.trophies, player1League, player2TrophyDelta
        ));

        console.log(`Matched users ${user1.username} and ${user2.username} with trophies ${user1.trophies} and ${user2.trophies}and delta ${player1TrophyDelta.trophyGain}/${player1TrophyDelta.trophyLoss} and ${player2TrophyDelta.trophyGain}/${player2TrophyDelta.trophyLoss}`);

        // Wait for client-side animations
        await sleep(5500);

        // Temporarily reset the activities of the users before adding them to the multiplayer room
        this.users.resetUserActivity(user1.userid);
        this.users.resetUserActivity(user2.userid);

        // Add the users to the multiplayer room, which will send them to the room
        const user1ID = {userid: user1.userid, sessionID: user1.sessionID};
        const user2ID = {userid: user2.userid, sessionID: user2.sessionID};

        try {
            const room = new RankedMultiplayerRoom(user1ID, user2ID, player1TrophyDelta, player2TrophyDelta);
            await EventConsumerManager.getInstance().getConsumer(RoomConsumer).createRoom(room);
        } catch (error) {

            // If room aborted, send push notification to notify
            if (error instanceof RoomAbortError) {
                [user1ID, user2ID].forEach(user => {
                    this.users.sendToUserSession(user.sessionID, new SendPushNotificationMessage(
                        NotificationType.ERROR, "Match aborted by opponent"
                    ));
                });
            }

            // Redirect users back to the home page
            [user1ID, user2ID].forEach(user => {
                this.users.sendToUserSession(user.sessionID, new RedirectMessage("/"));
            });
            
        }
        
    }

    /**
     * Send the number of players in the queue to all users in the queue
     */
    private async sendNumQueuingPlayers() {
        const numQueuingPlayers = this.playersInQueue();

        this.queue.forEach(user => this.users.sendToUserSession(
            user.sessionID,
            new NumQueuingPlayersMessage(numQueuingPlayers)
        ));
    }

}