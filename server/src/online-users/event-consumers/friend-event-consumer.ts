import { FriendUpdateData, FriendUpdateMessage } from "../../../shared/network/json-message";
import { DBObjectNotFoundError } from "../../database/db-object-error";
import { Database, DBQuery, WriteDBQuery } from "../../database/db-query";
import { EventConsumer } from "../event-consumer";
import { OnUserActivityChangeEvent, OnUserConnectEvent, OnUserDisconnectEvent } from "../online-user-events";
import { DBUserObject } from "../../database/db-objects/db-user";
import { FriendInfo } from "../../../shared/models/friends";
import { DBUser } from "../../../shared/models/db-user";

// Gets the list of friend userids for a given user
class GetFriendsQuery extends DBQuery<string[]> {

    // Because friends are represented by a single row representing a mutual friendship, we need check both columns
    public override readonly query = `
        SELECT userid2 as userid
        FROM friends
        WHERE userid1 = $1
        UNION
        SELECT userid1 as userid
        FROM friends
        WHERE userid2 = $1
    `;

    public override readonly warningMs = null;

    constructor(userid: string) {
        super([userid]);
    }

    public override parseResult(resultRows: any[]): string[] {
        return resultRows.map((row) => row.userid);
    }
}

// Create a friend relationship between two users
class MakeFriendsQuery extends WriteDBQuery {
    
    public override readonly query = `
        INSERT INTO friends (userid1, userid2)
        VALUES ($1, $2)
    `;

    public override readonly warningMs = null;

    constructor(userid1: string, userid2: string) {

        // Ensure that the userids are ordered so that the same relationship is created regardless of order
        const orderedUserIds = (userid1 < userid2) ? [userid1, userid2] : [userid2, userid1];

        super(orderedUserIds);
    }
}

// Remove a friend relationship between two users
class RemoveFriendsQuery extends WriteDBQuery {

    public override readonly query = `
        DELETE FROM friends
        WHERE (userid1 = $1 AND userid2 = $2) OR (userid1 = $2 AND userid2 = $1)
    `;

    public override readonly warningMs = null;

    constructor(userid1: string, userid2: string) {
        super([userid1, userid2]);
    }
}


// Event consumer that handles friend events
export class FriendEventConsumer extends EventConsumer {

    public override init() {

        // When a user's stat changes that is visible on the friends page, update all friends
        DBUserObject.onChange().subscribe(async ({ id: userid, before: beforeUser, after: afterUser, event }) => {

            // If the change is not relevant to friends, ignore
            if (!this.isvisibleFriendStatChange(beforeUser, afterUser)) return;

            // Send friend update messages to all friends
            await this.updateFriend(userid, {
                update: this.getFriendInfoForUser(afterUser)
            });
        });

    }

    /**
     * Whether at least one visible friend stat has changed for the given user
     * @param beforeUser The user object before the change
     * @param afterUser The user object after the change
     * @returns Whether at least one visible friend stat has changed
     */
    private isvisibleFriendStatChange(beforeUser: DBUser, afterUser: DBUser): boolean {

        // Relevant changes are league, highest_score, trophies, and puzzle_elo
        return beforeUser.league !== afterUser.league
            || beforeUser.highest_score !== afterUser.highest_score
            || beforeUser.trophies !== afterUser.trophies
            || beforeUser.puzzle_elo !== afterUser.puzzle_elo;
    }

    /**
     * Get the friend info for a user given their DBUser object
     * @param user The DBUser object
     * @returns The friend info for the user
     */
    private getFriendInfoForUser(user: DBUser): FriendInfo {
        return {
            userid: user.userid,
            username: user.username,
            isOnline: this.users.isUserOnline(user.userid),
            activity: this.users.getUserActivityType(user.userid),
            league: user.league,
            highestScore: user.highest_score,
            trophies: user.trophies,
            puzzleElo: user.puzzle_elo
        };
    }

    /**
     * Add a friend relationship between two users, and send friend update messages to both users
     * @param userid1 First user's userid
     * @param userid2 Second user's userid
     */
    public async addFriend(userid1: string, userid2: string) {

        // Add database row for friend relationship
        await Database.query(MakeFriendsQuery, userid1, userid2);

        // Get user info for both users
        const [user1Request, user2Request] = await Promise.all([
            DBUserObject.get(userid1),
            DBUserObject.get(userid2)
        ]);

        // Send friend update messages to both users to add the friend
        this.users.sendToUser(userid1, new FriendUpdateMessage(userid1, {
            create: this.getFriendInfoForUser(user2Request)
        }));
        this.users.sendToUser(userid2, new FriendUpdateMessage(userid2, {
            create: this.getFriendInfoForUser(user1Request)
        }));
    }

    /**
     * Remove a friend relationship between two users, and send friend update messages to both users
     * @param userid1 First user's userid
     * @param userid2 Second user's userid
     */
    public async removeFriend(userid1: string, userid2: string) {

        // Remove database row for friend relationship
        await Database.query(RemoveFriendsQuery, userid1, userid2);

        // Send friend update messages to both users to remove the friend
        this.users.sendToUser(userid1, new FriendUpdateMessage(userid2, {} ));
        this.users.sendToUser(userid2, new FriendUpdateMessage(userid1, {} ));
    }


    // On user connect, update the online status of all friends to online
    protected override async onUserConnect(event: OnUserConnectEvent) {
        await this.updateFriend(event.userid, {
                update: { isOnline: true }
        });
    }

    // On user disconnect, update the online status of all friends to offline
    protected override async onUserDisconnect(event: OnUserDisconnectEvent) {
        await this.updateFriend(event.userid, {
            update: { isOnline: false }
        });
    }

    // On user activity change, update the activity of all friends
    protected override async onUserActivityChange(event: OnUserActivityChangeEvent): Promise<void> {
        await this.updateFriend(event.userid, {
            update: { activity: event.activity }
        });
    }

    // For each online friend, send them a message with the updated friend data
    private async updateFriend(userid: string, data: FriendUpdateData) {
        
        // Get a list of all friend userids for the given user from the database
        let allFriendUserids: string[];
        try {
            allFriendUserids = await Database.query(GetFriendsQuery, userid);
        } catch (err: any) {
            // If user doesn't exist, it means it was a guest account that got deleted
            if (err instanceof DBObjectNotFoundError) return;

            throw err;
        }
        
        // For each friend, send the message
        allFriendUserids.forEach((friendID) => this.users.sendToUser(friendID, new FriendUpdateMessage(
            userid,
            data
        )));
    }
}