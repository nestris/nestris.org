import { Request, Response } from 'express';
import { BroadcastAnnouncementMessage } from '../../network-protocol/json-message';
import { ServerState } from '../server-state/server-state';

/**
 * POST /api/broadcast-announcement
 * announce message to all online users. useful for maintenance announcements and the like
 * @param req.body.message - the message to send
 * @param req.body.password - must match ADMIN_PASSWORD in the .env file for the message to be sent
 */
export async function broadcastAnnouncementRoute(req: Request, res: Response, state: ServerState) {

    const password = req.body.password;
    const message = req.body.message;

    if (password !== process.env['ADMIN_PASSWORD']) {
        res.status(401).send("Invalid password");
        return;
    }

    state.onlineUserManager.sendToAllOnlineUsers(new BroadcastAnnouncementMessage(message));

    const numOnlineUsers = state.onlineUserManager.numOnlineUsers();
    res.status(200).send("Message sent to " + numOnlineUsers + " online users");

}