import { Request, Response } from 'express';
import { getAllUsernames, getUserByUsername } from '../database/user/user-service';
import { IUserSchema } from 'server/database/user/user-schema';

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