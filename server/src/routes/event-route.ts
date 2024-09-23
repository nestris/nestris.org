import { Request, Response } from 'express';
import { Event } from '../../shared/models/event';
import { queryUserByUserID } from '../database/user-queries';
import { queryDB } from '../database';

// find a user by matching username and return the user
export async function postEventToDB(event: Event) {

    // make a SQL query to get the user with the specified username
    const query = `INSERT INTO events (userid, sessionid, event) VALUES ($1, $2, $3)`;
    const result = await queryDB(query, [event.userid, event.sessionid, event.event]);

    return result;
  }

// POST with request body Event
export async function postEventRoute(req: Request, res: Response) {

    const event: Event = req.body;

    // If userid exists, check that it is a valid userid
    if (event.userid) {
        const user = await queryUserByUserID(event.userid);
        if (!user) {
            res.status(400).send("Invalid userid");
            return;
        }
    } else event.userid = null;

    // Write the event to the database
    try {
        const result = await postEventToDB(event);
        res.status(200).send(result);
    } catch (e) {
        res.status(500).send(`Error writing event to database: ${e}`);
    }
}