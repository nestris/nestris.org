import express from 'express';
import bcrypt from 'bcrypt';
import { Database, DBQuery, WriteDBQuery } from '../database/db-query';
import { UsernameExistsQuery } from '../database/db-queries/username-exists-query';
import { v4 as uuidv4 } from 'uuid';
import { createUserSession } from './session-util';
import { DBUserObject } from '../database/db-objects/db-user';
import { Authentication, DBUser, LoginMethod } from '../../shared/models/db-user';
import { GetUserByUsername } from '../database/db-queries/get-user-by-username';

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param {string} password - The plaintext password to hash
 * @param {number} saltRounds - The cost factor for hashing. Defaults to 10.
 * @returns {Promise<string>} A Promise that resolves with the hashed password
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  // Generate a salt and hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

/**
 * Checks if a plaintext password matches a stored bcrypt hashed password.
 *
 * @param {string} plaintextPassword - The plaintext password entered by the user
 * @param {string} hashedPassword - The bcrypt hash stored in the database
 * @returns {Promise<boolean>} True if the passwords match, false otherwise
 */
export async function checkPassword(plaintextPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plaintextPassword, hashedPassword);
}

class SetHashedPasswordQuery extends WriteDBQuery {
    public override query = `
        INSERT INTO "public"."password_users"("userid", "password")
        VALUES ($1, $2)
        ON CONFLICT("userid")
        DO UPDATE SET "password" = EXCLUDED."password";
    `;
    public override warningMs = null;

    constructor(userid: string, encryptedPassword: string) {
        super([userid, encryptedPassword]);
    }
}

class GetHashedPasswordQuery extends DBQuery<string> {
    public override query = `
        SELECT "password"
        FROM "public"."password_users"
        WHERE "userid" = $1
        LIMIT 1;
    `;
    public override warningMs = null;

    constructor(userid: string) {
        super([userid]);
    }

    public override parseResult(resultRows: any[]): string {

        if (resultRows.length === 0) {
            throw new Error(`No password found for user ${this.params[0]}`);
        }

        return resultRows[0].password;
    }
}

export async function passwordRegister(req: express.Request, res: express.Response) {
    let username = req.body.username;
    let password = req.body.password;

    // Assert that the username and password are not empty
    if (!username || !password) return res.status(400).send('Username and password are required');

    // Convert username and password to strings
    username = username.toString();
    password = password.toString();

    // Assert that the username is unique
    const usernameExists = await Database.query(UsernameExistsQuery, username);
    if (usernameExists) return res.status(403).send('Username already exists');

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Generate a new user ID
    const userID = uuidv4();

    // Create new user
    console.log(`Creating new user ${username} with ID ${userID} with password login`);
    let user: DBUser;
    try {
        user = await DBUserObject.create(userID, {
            username: username,
            login_method: LoginMethod.PASSWORD,
            authentication: Authentication.USER
        });
    } catch (error) {
        console.error('Error creating new user:', error);
        return res.status(500).send(`Error creating new user: ${error}`);
    }

    // Store the hashed password in the database
    try {
        await Database.query(SetHashedPasswordQuery, userID, hashedPassword);
    } catch (error) {
        console.error('Error setting hashed password:', error);
        return res.status(500).send(`Error setting hashed password: ${error}`);
    }

    // Log the user in by setting user session
    createUserSession(req, userID, username, user.authentication);
    console.log(`Authenticated user ${user.username} with ID ${userID}, redirecting to play`);

    res.status(200).send({msg: 'Registered through password'});
}

export async function passwordLogin(req: express.Request, res: express.Response) {
    let username = req.body.username;
    let password = req.body.password;

    // Assert that the username and password are not empty
    if (!username || !password) return res.status(400).send('Username and password are required');

    // Convert username and password to strings
    username = username.toString();
    password = password.toString();


    // Get the user from the database
    let user: DBUser;
    try {
        user = await Database.query(GetUserByUsername, username);
    } catch (error) {
        console.error('Error getting user by username:', error);
        return res.status(404).send(`User with username ${username} not found`);
    }

    // Get the hashed password from the database
    let hashedPassword: string;
    try {
        hashedPassword = await Database.query(GetHashedPasswordQuery, user.userid);
    } catch (error) {
        console.error('Not a password user:', error);
        return res.status(409).send('Not a password user');
    }

    // Check if the password is correct
    const passwordCorrect = await checkPassword(password, hashedPassword);
    if (!passwordCorrect) return res.status(403).send('Incorrect password');

    // Log the user in by setting user session
    createUserSession(req, user.userid, user.username, user.authentication);
    console.log(`Authenticated user ${user.username} with ID ${user.userid}, redirecting to play`);
    
    res.status(200).send({msg: 'Logged in through password'});
}