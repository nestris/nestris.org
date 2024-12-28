import express from 'express';
import axios from 'axios';
import { Authentication, DBUser, LoginMethod } from '../../shared/models/db-user';
import { DBUserObject } from '../database/db-objects/db-user';
import { DBObjectNotFoundError } from '../database/db-object-error';
import { createUserSession, UserSession } from './session-util';
import { Database } from '../database/db-query';
import { UsernameExistsQuery } from '../database/db-queries/username-exists-query';

require('dotenv').config();

const DISCORD_API_URL = 'https://discord.com/api';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

// Hardcode my Discord ID for admin permissions
const ANSEL_DISCORD_ID = "450748389001265186";

let redirectUri: string;

export const redirectToDiscord = (req: express.Request, res: express.Response) => {
    redirectUri = req.query.redirectUri as string;
    const authorizeUrl = `${DISCORD_API_URL}/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    // send the link to the client
    res.redirect(authorizeUrl);
};

// Return the first version of the username that doesn't already exist in the database
async function generateUniqueUsername(username: string) {

    // If the username is already unique, return it
    const usernameExists = await Database.query(UsernameExistsQuery, username);
    if (!usernameExists) {
        console.log(`Username ${username} is already unique`);
        return username;
    }

    console.log(`Username ${username} already exists, generating a new one`);

    // If the username already exists, add a number to the end of the username
    let i = 2;
    while (await Database.query(UsernameExistsQuery, `${username}${i}`)) {
        i++;
    }
    return `${username}${i}`;
}

export async function handleDiscordCallback(req: express.Request, res: express.Response) {
    const code = req.query.code as string;
    if (!code) {
        return res.status(400).send('Code is missing');
    }

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

        const userResponse = await axios.get(`${DISCORD_API_URL}/users/@me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const userID = userResponse.data.id;

        // Check if the user is already in the database. If not, create a new user.        
        let user: DBUser;
        try {
            // Try to get the user from the database
            user = await DBUserObject.get(userID);
        } catch (error: any) {

            if (error instanceof DBObjectNotFoundError) {
                // If user does not exist, create a new user with username from Discord global name
                let newUsername = userResponse.data.global_name ?? userResponse.data.username ?? "UnknownUser";

                console.log(`User ${userID} not found in the database, creating new user with username ${newUsername}`);

                // Generate a unique username
                newUsername = await generateUniqueUsername(newUsername);

                // Create the new user with username
                console.log(`Creating new user ${newUsername} with ID ${userID} with Discord login`);
                user = await DBUserObject.create(userID, {
                    username: newUsername,
                    login_method:
                    LoginMethod.DISCORD,
                    authentication: userID === ANSEL_DISCORD_ID ? Authentication.ADMIN : Authentication.USER
                });
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