import express from 'express';
import { Authentication, LoginMethod } from "../../shared/models/db-user";
import { DBUserObject } from "../database/db-objects/db-user";
import { createUserSession } from './session-util';

/**
 * Register a guest user with a random userid and username. This creates a new user in the database, and sets the session to the new user.
 * On disconnect, the guest user will be deleted from the database.
 */
export async function registerAsGuest(req: express.Request, res: express.Response) {

    // Generates a random username for the guest
    async function generateRandomGuestUsername() {
        while (true) {
            // generate username with random number
            const randomUsername = `guest${Math.floor(Math.random() * 1000000)}`;

            // If the username is unique, return it
            if (!(await DBUserObject.exists(randomUsername))) {
                return randomUsername;
            }
        }
    }
    const username = await generateRandomGuestUsername();
    
    // Create the guest user in the database, with equal userid and username
    const user = await DBUserObject.create(username, {
        username: username,
        login_method: LoginMethod.GUEST,
       authentication: Authentication.USER,
    });

    // Store the user's session and redirect to play
    createUserSession(req, res, user.userid, user.username, user.authentication);

    res.status(200).send({msg: 'Registered as guest'});
}