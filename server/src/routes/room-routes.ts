import { Request, Response } from 'express';
import { ServerState } from '../server-state/server-state';
import { getUserID } from '../util/auth-util';

export async function leaveRoomRoute(req: Request, res: Response, state: ServerState) {

    // Verify user exists
    const sessionID = req.params['sessionID'];
    const roomUser = state.roomManager.getUserBySessionID(sessionID);
    if (!roomUser) {
        res.status(404).send({error: "User not found"});
        return;
    }

    // Verify the user is the one making the request
    if (roomUser.session.user.userid !== getUserID(req)) {
        res.status(403).send({error: "You do not have permission to access this resource"});
        return;
    }

    // Leave room
    const isEmpty = await roomUser.room.removeUser(roomUser);
    if (isEmpty) state.roomManager.removeEmptyRooms();

    res.status(200).send({success: true});
}