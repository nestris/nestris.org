import express from 'express';
import axios from 'axios';
import session from 'express-session';
import { createUser, queryUserByUserID } from '../database-old/user-queries';
import { Authentication } from '../../shared/models/db-user';

require('dotenv').config();

const DISCORD_API_URL = 'https://discord.com/api';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

let redirectUri: string;

export interface UserSession extends session.Session {
    userid: string;
    username: string;
    permission: Authentication;
    accessToken: string;
    refreshToken: string;
}

export const redirectToDiscord = (req: express.Request, res: express.Response) => {
    redirectUri = req.query.redirectUri as string;
    const authorizeUrl = `${DISCORD_API_URL}/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    // send the link to the client
    console.log("redirecting to discord with url", authorizeUrl);
    res.redirect(authorizeUrl);
};

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
        let username: string;
        let permission: Authentication;
        const user = await queryUserByUserID(userID);
        if (user) {
            // If user already exists, fetch username from database
            username = user.username;
            permission = user.authentication;
        } else {
            // If user does not exist, create a new user with username from Discord global name
            username = userResponse.data.global_name ?? userResponse.data.username ?? "Unknown User";
            permission = await createUser(userID, username);
        }

        // Store the user's session
        (req.session as UserSession).accessToken = accessToken;
        (req.session as UserSession).refreshToken = refreshToken;
        (req.session as UserSession).userid = userID;
        (req.session as UserSession).username = username;
        (req.session as UserSession).permission = permission;

        // Check if the user is already in the database. If not, create a new user.
        if (user) {
            // User already exists. Go to Play page
            res.redirect('/play');
            console.log(`Authenticated returning user ${username}, redirecting to play`);
        } else {
            // New User. Go to welcome page
            console.log(`Authenticated new user ${username}, redirecting to welcome`);
            res.redirect('/welcome');
        }
        
    } catch (error) {
        console.error('Error during Discord OAuth:', error);
        res.status(500).send(`An error occurred during authentication: ${error}`);
    }
};

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