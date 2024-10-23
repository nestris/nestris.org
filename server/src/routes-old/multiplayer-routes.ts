import { Request, Response } from 'express';
import { ServerState } from '../old/server-state';
import { getUserID } from '../util/auth-util';
import { MultiplayerPlayerMode, MultiplayerRoomMode, PlayerRole } from '../../shared/models/multiplayer';
import { MultiplayerManager } from '../online-users/room-multiplayer-manager';

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

// Extract the multiplayer manager, player role, and session ID from the request
// If the request is not valid, send an error response and throw an error instead
function verifyMultiplayerRequest(req: Request, res: Response, state: ServerState): {
    multiplayer: MultiplayerManager,
    playerRole: PlayerRole,
} {

    // Verify user exists
    const sessionID = req.params['sessionID'];
    const roomUser = state.roomManager.getUserBySessionID(sessionID);
    if (!roomUser) {
        res.status(404).send({error: "User not found"});
        throw new Error("User not found");
    }

    // Verify the user is the one making the request
    if (roomUser.session.user.userid !== getUserID(req)) {
        res.status(403).send({error: "You do not have permission to access this resource"});
        throw new Error("User does not have permission to access this resource");
    }

    // Verify room is a multiplayer room
    const multiplayer = roomUser.room.multiplayer;
    if (!multiplayer) {
        res.status(400).send({error: "Room is not a multiplayer room"});
        throw new Error("Room is not a multiplayer room");
    }

    // Get player role
    const playerRole = multiplayer.getPlayerRoleBySessionID(sessionID);
    return {multiplayer, playerRole};

}

export function setMultiplayerReadiness(req: Request, res: Response, state: ServerState) {

    let response;
    try {
        response = verifyMultiplayerRequest(req, res, state);
    } catch (e) {
        // Error response already sent
        return;
    }
    const {multiplayer, playerRole} = response;

    // Verify isReady parameter
    if (!['true', 'false'].includes(req.params['isReady'])) {
        res.status(400).send({error: "Invalid isReady parameter"});
        return;
    }
    const isReady = req.params['isReady'] === 'true';
    
    try {
        if (isReady) multiplayer.setPlayerReady(playerRole);
        else multiplayer.setPlayerNotReady(playerRole);
        res.status(200).send({success: true});
    } catch (e: any) {
        // Something went wrong with setting the player readiness
        res.status(400).send({error: e.message});
    }
}

export function selectLevelForPlayer(req: Request, res: Response, state: ServerState) {

    let response;
    try {
        response = verifyMultiplayerRequest(req, res, state);
    } catch (e) {
        // Error response already sent
        console.log(e);
        return;
    }
    const {multiplayer, playerRole} = response;

    const level = parseInt(req.params['level']);
    if (isNaN(level)) {
        res.status(400).send({error: "Invalid level parameter"});
        return;
    }

    try {
        multiplayer.selectLevelForPlayer(playerRole, level);
        res.status(200).send({success: true});
    } catch (e: any) {
        res.status(400).send({error: e.message});
    }   
}

export function transitionDeadToWaiting(req: Request, res: Response, state: ServerState) {

    let response;
    try {
        response = verifyMultiplayerRequest(req, res, state);
    } catch (e) {
        // Error response already sent
        return;
    }
    const {multiplayer, playerRole} = response;

    try {
        multiplayer.transitionDeadPlayerToWaiting(playerRole);
        res.status(200).send({success: true});
    } catch (e: any) {
        res.status(400).send({error: e.message});
    }
}