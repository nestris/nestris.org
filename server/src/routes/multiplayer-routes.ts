import { Request, Response } from 'express';
import { ServerState } from '../server-state/server-state';
import { getUserID } from '../util/auth-util';
import { MultiplayerPlayerMode, MultiplayerRoomMode } from '../../shared/models/multiplayer';

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

export function setMultiplayerReadiness(req: Request, res: Response, state: ServerState) {

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

    // Verify isReady parameter
    if (!['true', 'false'].includes(req.params['isReady'])) {
        res.status(400).send({error: "Invalid isReady parameter"});
        return;
    }
    const isReady = req.params['isReady'] === 'true';

    // Verify room is a multiplayer room
    const multiplayer = roomUser.room.multiplayer;
    if (!multiplayer) {
        res.status(400).send({error: "Room is not a multiplayer room"});
        return;
    }
    
    // Set player readiness
    const playerRole = multiplayer.getPlayerRoleBySessionID(sessionID);
    try {
        if (isReady) multiplayer.setPlayerReady(playerRole);
        else multiplayer.setPlayerNotReady(playerRole);
        res.status(200).send({success: true});
    } catch (e: any) {
        // Something went wrong with setting the player readiness
        res.status(400).send({error: e.message});
    }
}