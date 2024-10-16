import { Request, Response } from 'express';
import { ServerState } from '../old/server-state';
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

    // Verify room exists
    const roomID = req.params['roomID'];
    const room = state.roomManager.getRoomByID(roomID);
    if (!room) {
        // Room does not exist
        res.status(200).send({success: false, error: "Room does not exist"});
        return;
    }
    if (room !== roomUser.room) {
        // Room user is in is not the same as the room in the request
        res.status(200).send({success: false, error: "User is in a different room"});
        return
    }

    // Leave room
    const isEmpty = await room.removeUser(roomUser);
    if (isEmpty) state.roomManager.removeEmptyRooms();

    res.status(200).send({success: true});
}