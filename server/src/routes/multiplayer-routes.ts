import { Request, Response } from 'express';
import { ServerState } from '../server-state/server-state';

export function getMultiplayerStateRoute(req: Request, res: Response, state: ServerState) {

    const roomID = req.params['roomID'];
    const room = state.roomManager.getRoomByID(roomID);
    if (!room) {
        res.status(404).send({error: "Room not found"});
        return;
    }

    if (!room.multiplayer) {
        res.status(400).send({error: "Room is not a multiplayer room"});
        return;
    }

    res.status(200).send(room.multiplayer.getData());
}