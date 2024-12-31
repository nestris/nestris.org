import { v4 as uuidv4 } from 'uuid';
import { DBUserObject } from '../database/db-objects/db-user';
import { Authentication, LoginMethod } from '../../shared/models/db-user';

export async function createBotUser(username: string) {

    // Generate a random UUID for the user
    const userID = uuidv4();
    
    // Create new user
    console.log(`Creating new user ${username} with ID ${userID} (BOT USER)`);
    const user = await DBUserObject.create(userID, {
        username: username,
        login_method: LoginMethod.BOT,
        authentication: Authentication.USER
    });
}

export class BotUser {

}

