import { Request, Response } from 'express';
import { getAllUsernames, getTrophiesXPForUsers, getUserByUsername } from '../database/user/user-service';
import { ServerState } from '../server-state/server-state';
import { FriendInfo, FriendStatus } from '../../network-protocol/models/friends';

/**
 * GET /api/all-usernames
 * get list of all the usernames in the database
 * @returns {usernames: string[]} - list of all usernames
 */
export async function getAllUsernamesRoute(req: Request, res: Response) {


    const usernames = await getAllUsernames();
    res.status(200).send({usernames: usernames});

}

/**
 * GET /api/user/:username
 * get a user by their username
 * @returns {IUserSchema} - the user
 */
export async function getUserByUsernameRoute(req: Request, res: Response) {
    try {
        const username = req.params['username'];
        const user = await getUserByUsername(username);
        if (user) {
            res.status(200).send(user);
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        // Log the error and send a 500 Internal Server error response
        console.error(error);
        res.status(500).send("An error occurred while retrieving user");
    }
}

/**
 * GET /api/all-friends-info/:username
 * for each friend/potential friend, get friend status, online status,  xp, and trophies
 * a somewhat expensive operation, so try not to call it sparingly
 * @returns {FriendInfo[]} - information for every user that has some sort of friend relationship with user
 */
export async function getFriendsInfoRoute(req: Request, res: Response, state: ServerState) {
    try {
        // first, fetch user info from db to get list of friends/potential friends
        const username = req.params['username'];
        const user = await getUserByUsername(username);
        if (user === undefined) {
            res.status(404).send("User not found");
            return;
        }

        // build up FriendInfo list with corresponding friend status
        const friendsInfo: FriendInfo[] = [];
        user.friends.forEach((friend) => friendsInfo.push(new FriendInfo(
            friend,
            FriendStatus.FRIENDS,
            state.onlineUserManager.getOnlineStatus(friend),
            0, 0 // trophies and xp to be set in the next step
        )));

        // get trophies/xp for each friend/potential friend from db and update friendsInfo
        const friendUsernames = friendsInfo.map((info) => info.username); // get list of usernames from all friends/potential friends
        const trophiesXP = await getTrophiesXPForUsers(friendUsernames); // poll db for trophies and xp from the list of usernames
        trophiesXP.forEach((tx) => { // update friendInfo with trophy and xp data from db
            const friend = friendsInfo.find((friendInfo) => friendInfo.username === tx.username); // find matching username
            if (friend) {
                friend.trophies = tx.trophies;
                friend.xp = tx.xp;
            }
        })

        // send to client
        res.status(200).send(friendsInfo);

    } catch (error) {
        // Log the error and send a 500 Internal Server error response
        console.error(error);
        res.status(500).send("An error occurred while retrieving user");
    }
}
