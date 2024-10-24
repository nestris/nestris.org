import express from 'express';
import axios from 'axios';
import session from 'express-session';
import { Authentication, DBUser } from '../../shared/models/db-user';
import { DBUserObject } from '../database/db-objects/db-user';
import { DBObjectNotFoundError } from '../database/db-object-error';

require('dotenv').config();

const DISCORD_API_URL = 'https://discord.com/api';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

let redirectUri: string;

export interface UserSession extends session.Session {
    userid: string;
    username: string;
    permission: Authentication;
}

export const redirectToDiscord = (req: express.Request, res: express.Response) => {
    redirectUri = req.query.redirectUri as string;
    const authorizeUrl = `${DISCORD_API_URL}/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    // send the link to the client
    console.log("redirecting to discord with url", authorizeUrl);
    res.redirect(authorizeUrl);
};

// Return the first version of the username that doesn't already exist in the database
async function generateUniqueUsername(username: string) {

    // If the username is already unique, return it
    if (!(await DBUserObject.exists(username))) {
        return username;
    }

    // If the username already exists, add a number to the end of the username
    let i = 2;
    while (await DBUserObject.exists(`${username}${i}`)) {
        i++;
    }
    return `${username}${i}`;
}

function createUserSession(req: express.Request, res: express.Response, userID: string, username: string, permission: Authentication) {

    // Store the user's session
    (req.session as UserSession).userid = userID;
    (req.session as UserSession).username = username;
    (req.session as UserSession).permission = permission;
}

export const handleDiscordCallback = async (req: express.Request, res: express.Response) => {
    const code = req.query.code as string;
    if (!code) {
        return res.status(400).send('Code is missing');
    }

    console.log("handling discord callback with code", code, "and redirect uri", redirectUri);

    try {
        const tokenResponse = await axios.post(`${DISCORD_API_URL}/oauth2/token`, {
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const accessToken = tokenResponse.data.access_token;
        const refreshToken = tokenResponse.data.refresh_token;

        console.log("got access token", accessToken, "and refresh token", refreshToken);

        const userResponse = await axios.get(`${DISCORD_API_URL}/users/@me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        console.log(userResponse.data);
        const userID = userResponse.data.id;

        // Check if the user is already in the database. If not, create a new user.        
        let user: DBUser;
        try {
            // Try to get the user from the database
            user = (await DBUserObject.get(userID)).object;
        } catch (error: any) {

            if (error instanceof DBObjectNotFoundError) {
                // If user does not exist, create a new user with username from Discord global name
                let newUsername = userResponse.data.global_name ?? userResponse.data.username ?? "UnknownUser";

                // Generate a unique username
                newUsername = await generateUniqueUsername(newUsername);

                // Create the new user with username
                console.log(`Creating new user ${newUsername} with ID ${userID}`);
                user = await DBUserObject.create(userID, { username: newUsername, is_guest: false });
            } else {
                throw error;
            }
        }

        createUserSession(req, res, userID, user.username, user.authentication);

        // Redirect to play
        console.log(`Authenticated user ${user.username} with ID ${userID}, redirecting to play`);
        res.redirect('/play');

    } catch (error) {
        console.error('Error during Discord OAuth:', error);
        res.status(500).send(`An error occurred during authentication: ${error}`);
    }
};

/**
 * Register a guest user with a random userid and username. This creates a new user in the database, and sets the session to the new user.
 * On disconnect, the guest user will be deleted from the database.
 */
export async function registerAsGuest(req: express.Request, res: express.Response) {

    // Generates a random username for the guest
    async function generateRandomGuestUsername() {
        while (true) {
            // generate username with random number between 0 and 9999999999
            const randomUsername = `guest${Math.floor(Math.random() * 10000000000)}`;

            // If the username is unique, return it
            if (!(await DBUserObject.exists(randomUsername))) {
                return randomUsername;
            }
        }
    }
    const username = await generateRandomGuestUsername();
    
    // Create the guest user in the database, with equal userid and username
    const user = await DBUserObject.create(username, { username: username, is_guest: true });

    // Store the user's session and redirect to play
    createUserSession(req, res, user.userid, user.username, user.authentication);

    res.status(200).send({msg: 'Registered as guest'});
}


export function handleLogout(req: express.Request, res: express.Response) {

    if (!req.session) {
      return res.status(200).send({msg: 'Logged out'});
    }
  
    console.log("logging out");
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send({msg: 'Failed to logout'});
        }
        res.status(200).send({msg: 'Logged out'});
    });
};