import { Request, Response } from 'express';
import { ServerState } from '../server-state/server-state';
import { SendPushNotificationMessage } from '../../shared/network/json-message';
import { NotificationType } from '../../shared/models/notifications';

/**
 * POST /api/broadcast-announcement
 * announce message to all online users. useful for maintenance announcements and the like
 * @param req.body.message - the message to send
 */
export async function broadcastAnnouncementRoute(req: Request, res: Response, state: ServerState) {

    const message = req.body.message;

    state.onlineUserManager.sendToAllOnlineUsers(new SendPushNotificationMessage(
        NotificationType.INFO,
        "Message from server: " + message
    ));

    const numOnlineUsers = state.onlineUserManager.numOnlineUsers();
    res.status(200).send("Message sent to " + numOnlineUsers + " online users");

}