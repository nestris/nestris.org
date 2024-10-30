import { EventConsumer } from "../event-consumer";
import { v4 as uuid } from "uuid";
import { OnSessionBinaryMessageEvent, OnSessionJsonMessageEvent } from "../online-user-events";
import { PacketDisassembler } from "../../../shared/network/stream-packets/packet-disassembler";
import { ChatMessage, InRoomStatus, InRoomStatusMessage, JsonMessageType, RoomPresenceMessage } from "../../../shared/network/json-message";
import { OnlineUserManager } from "../online-user-manager";
import { BehaviorSubject, Observable } from "rxjs";

export class RoomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RoomError";
    }
}

/**
 * 
 * A room contains a list of players and a list of spectators.
 * 
 * The server sends IN_ROOM_STATUS messages to the client to indicate which room the client is in, if any, and whether the 
 * client is a player or a spectator in the room. This doesn't necessarily mean the client has to be present in the room,
 * but it means that the client will be streamed messages from the room. This way, the client can keep track of which room
 * it is in, and whether it is a player or a spectator in the room.
 * 
 * The client sends ROOM_PRESENCE messages to the server to indicate whether the client is actually present and viewing a
 * room. This can be used to indicate to the room server-side that while a player is in a room, they are not actually viewing
 * it. For example, if all players are in the room but not viewing it, room should delete itself.
 * 
 * 
 */

export class RoomPlayer {

    private presentInRoom$: BehaviorSubject<boolean>;
    
    constructor(
        public readonly sessionID: string,
        presentInRoom: boolean,
    ) {
        this.presentInRoom$ = new BehaviorSubject(presentInRoom);
    }

    public getPrescence$(): Observable<boolean> {
        return this.presentInRoom$.asObservable();
    }

    public getPrescence(): boolean {
        return this.presentInRoom$.getValue();
    }

    public setPresence(present: boolean) {
        this.presentInRoom$.next(present);
    }

}

export class RoomSpectator {
    constructor(
        public readonly sessionID: string,
    ) {}
}

export abstract class Room {

    // Unique id of the room
    public readonly id = uuid();
    
    // List of players in the room, and whether they are present in the room, with the players initialized in constructor
    protected readonly players: RoomPlayer[];

    // List of spectators in the room, with no spectators at the start
    protected readonly spectators: RoomSpectator[] = [];

    constructor(
        protected readonly users: OnlineUserManager,
        playerSessionIDs: string[], // A list of session ids of players in the room
    ) {

        // Initialize players as RoomPlayer objects that are not present in the room. On ROOM_PRESENCE messages, they will
        // be marked as present in the room.
        this.players = playerSessionIDs.map(sessionID => new RoomPlayer(sessionID, false));

        // Send IN_ROOM_STATUS messages to all players in the room to indicate that they are players in the room
        this.playerSessionIDs.forEach(sessionID => {
            this.users.sendToUserSession(sessionID, new InRoomStatusMessage(InRoomStatus.PLAYER, this.id));
        });
    }

    // ======================== PUBLIC GETTERS ========================

    /**
     * Get all session ids for players in the room
     */
    public get playerSessionIDs(): string[] {
        return this.players.map(player => player.sessionID);
    }

    /**
     * Get all session ids for spectators in the room
     */
    public get spectatorSessionIDs(): string[] {
        return this.spectators.map(spectator => spectator.sessionID);
    }

    /**
     * Get all session ids for all users in the room
     */
    public get allSessionIDs(): string[] {
        return this.playerSessionIDs.concat(this.spectatorSessionIDs);
    }

    /**
     * Check if the session id is of a player in the room.
     * @param sessionID The session id to check
     * @returns True if the session id is of a player in the room, false otherwise.
     */
    public isPlayer(sessionID: string): boolean {
        return this.playerSessionIDs.includes(sessionID);
    }

    /**
     * Get the presence of a player in the room as an observable.
     * @param sessionID The session id of the player to check
     * @returns An observable that emits the presence of the player in the room
     * @throws Error if the session id is not a player in the room
     */
    public getPlayerPresence$(sessionID: string): Observable<boolean> {
        const player = this.players.find(player => player.sessionID === sessionID);
        if (!player) throw new RoomError(`Session ${sessionID} is not a player in room ${this.id}`);
        return player.getPrescence$();
    }

    /**
     * Get the presence of a player in the room.
     * @param sessionID The session id of the player to check
     * @returns The presence of the player in the room
     * @throws Error if the session id is not a player in the room
     */
    public getPlayerPresence(sessionID: string): boolean {
        const player = this.players.find(player => player.sessionID === sessionID);
        if (!player) throw new RoomError(`Session ${sessionID} is not a player in room ${this.id}`);
        return player.getPrescence();
    }


    // ======================== IMPLEMENTABLE ROOM EVENT HOOKS ========================

    /**
     * Overwrite this method to handle when the room is created.
     */
    protected async onCreate(): Promise<void> {}

    /**
     * Overwrite this method to handle when the room is deleted.
     */
    protected async onDelete(): Promise<void> {}

    /**
     * Overwrite this method to handle when a player sends a binary message.
     * @param sessionID The session id of the player that sent the message, guaranteed to be a player in the room.
     * @param message The binary message that was sent.
     */
    protected async onPlayerSendBinaryMessage(sessionID: string, message: PacketDisassembler): Promise<void> {}

    /**
     * Override this method to handle when a spectator joins the room.
     * @param sessionID The session id of the spectator that joined the room.
     */
    protected async onSpectatorJoin(sessionID: string): Promise<void> {}

    /**
     * Override this method to handle when a spectator leaves the room.
     * @param sessionID The session id of the spectator that left the room.
     */
    protected async onSpectatorLeave(sessionID: string): Promise<void> {}




    // ======================== METHODS ONLY CALLED BY RoomConsumer ========================

    /**
     * Initialize the room. This should only be called by the RoomConsumer right after the room is created.
     */
    public async _init() {
        await this.onCreate();
    }

    /**
     * If received a binary message from a player, forward it to all players and spectators in the room. This should only be called by the RoomConsumer.
     * @param sessionID The session id of the player that sent the message.
     * @param message The binary message to forward.
     */
    public async _onPlayerSendBinaryMessage(sessionID: string, message: PacketDisassembler) {
        await this.onPlayerSendBinaryMessage(sessionID, message);
    }

    /**
     * If received a chat message, forward it to all players and spectators in the room. This should only be called by the RoomConsumer.
     * @param message The chat message to forward.
     */
    public _onChatMessage(message: ChatMessage) {
        this.allSessionIDs.forEach(sessionID => {
            this.users.sendToUserSession(sessionID, message);
        });
    }

    /**
     * Set the presence of a player in the room. This should only be called by the RoomConsumer, which will set the presence
     * of the player based on the ROOM_PRESENCE message received from the client.
     * @param sessionID The session id of the player to set the presence of
     * @param present Whether the player is present in the room
     * @throws Error if the session id is not a player in the room
     */
    public _setPlayerPresence(sessionID: string, present: boolean) {
        const player = this.players.find(player => player.sessionID === sessionID);
        if (!player) throw new RoomError(`Session ${sessionID} is not a player in room ${this.id}`);
        player.setPresence(present);
    }

    /**
     * Add a spectator to the room. This should only be called by the RoomConsumer, which will add the spectator based on the
     * ROOM_PRESENCE message received from the client.
     * @param sessionID The session id of the spectator to add
     */
    public async _addSpectator(sessionID: string) {

        // Add the spectator to the list of spectators
        this.spectators.push(new RoomSpectator(sessionID));

        // Send a IN_ROOM_STATUS message to the spectator to indicate that they are a spectator in the room
        this.users.sendToUserSession(sessionID, new InRoomStatusMessage(InRoomStatus.SPECTATOR, this.id));

        // Call the onSpectatorJoin hook that may be implemented by subclasses
        await this.onSpectatorJoin(sessionID);
    }

    /**
     * Remove a spectator from the room. This should only be called by the RoomConsumer, which will remove the spectator based on the
     * ROOM_PRESENCE message received from the client.
     * @param sessionID The session id of the spectator to remove
     * @throws Error if the session id is not a spectator in the room
     */
    public async _removeSpectator(sessionID: string) {

        // Remove the spectator from the list of spectators
        const index = this.spectators.findIndex(spectator => spectator.sessionID === sessionID);
        if (index === -1) throw new RoomError(`Session ${sessionID} is not a spectator in room ${this.id}`);
        this.spectators.splice(index, 1);

        // Send a IN_ROOM_STATUS message to the spectator to indicate that they are not in any room
        this.users.sendToUserSession(sessionID, new InRoomStatusMessage(InRoomStatus.NONE, null));

        // Call the onSpectatorLeave hook that may be implemented by subclasses
        await this.onSpectatorLeave(sessionID);
    }

    /**
     * Destructor for the room. This must be called ONLY by the RoomConsumer when the room is to be deleted.
     */
    async _destructor() {

        // Send IN_ROOM_STATUS messages to all players and spectators in the room to indicate that they are not in any room anymore
        this.allSessionIDs.forEach(sessionID => {
            this.users.sendToUserSession(sessionID, new InRoomStatusMessage(InRoomStatus.NONE, null));
        });

        // Call the onDelete hook that may be implemented by subclasses
        await this.onDelete();
    }

}

/**
 * Consumer for handling completed quests and notifying the user of it.
 */
export class RoomConsumer extends EventConsumer {

    // Map storing room id to room object
    private rooms: Map<string, Room> = new Map();

    // Map storing session id to room id
    private sessions: Map<string, string> = new Map();

    /**
     * Given a session id, get the room the user is in.
     * @param sessionID The session id to check
     * @returns The room the user is in, or undefined if the user is not in any room.
     */
    private getRoomBySessionID(sessionID: string): Room | undefined {
        const roomid = this.sessions.get(sessionID);
        if (!roomid) return undefined;
        return this.rooms.get(roomid);
    }

    /**
     * Handles binary messages received from the client.
     * @param event The event containing the session id and the binary message.
     * @throws RoomError for known errors that should be sent to the client.
     */
    protected override async onSessionBinaryMessage(event: OnSessionBinaryMessageEvent): Promise<void> {
        
        const room = this.getRoomBySessionID(event.sessionID);
        if (!room) {
            console.warn(`Received binary message ${event} from session ${event.sessionID}, but is not in any room`);
            return;
        }
        
        // Forward the message to the room
        await room._onPlayerSendBinaryMessage(event.sessionID, event.message);
    }

    /**
     * Handles JSON messages received from the client.
     * @param event The event containing the session id and the JSON message.
     * @throws RoomError for known errors that should be sent to the client.
     */
    protected override async onSessionJsonMessage(event: OnSessionJsonMessageEvent): Promise<void> {
        if (event.message.type === JsonMessageType.CHAT) await this.handleChatMessage(event);
        else if (event.message.type === JsonMessageType.ROOM_PRESENCE) await this.handleRoomPresenceMessage(event);
    }

    /**
     * Handles CHAT messages received from the client. Checks that the user is playing in a room, and forwards the
     */
    private async handleChatMessage(event: OnSessionJsonMessageEvent) {
        const room = this.getRoomBySessionID(event.sessionID);
        if (!room) {
            console.warn(`Received chat message ${event} from session ${event.sessionID}, but is not in any room`);
            return;
        }

        room._onChatMessage(event.message as ChatMessage);
    }

    /**
     * Handles ROOM_PRESENCE messages received from the client. If a room is specified, it means that the user
     * joined the room client-side. If no room is specified, it means that the user left the room client-side.
     */
    private async handleRoomPresenceMessage(event: OnSessionJsonMessageEvent) {

        // Check if the session already belongs to a room, and if it is the same room. If the session is trying to join a room
        // and is already marked a player in the room, then the session is a player. Otherwise, add the session as a spectator.
        const joinRoomID = (event.message as RoomPresenceMessage).roomID;
        
        if (joinRoomID) { // Joining a room client-side

            // Get the room the user is trying to join
            const joinRoom = this.rooms.get(joinRoomID);

            if (!joinRoom) throw new RoomError(`Room ${joinRoomID} does not exist`);

            // Check if the session is already in this room
            const sessionCurrentRoom = this.getRoomBySessionID(event.sessionID);

            if (!sessionCurrentRoom) { // (Not in any room -> join room) ==> join room as spectator
                this.sessions.set(event.sessionID, joinRoomID);
                await joinRoom._addSpectator(event.sessionID);

            } else if (sessionCurrentRoom.id === joinRoomID) { // (In room -> join room) ==> if player, set presence to true
                if (joinRoom.isPlayer(event.sessionID)) {
                    joinRoom._setPlayerPresence(event.sessionID, true);
                } else {
                    console.warn(`Redundant ROOM_PRESENCE message: Session ${event.sessionID} is already in room ${joinRoomID}`);
                }
            }

            else { // (In another room -> join room) ==> leave current room, join new room as spectator
                if (sessionCurrentRoom.isPlayer(event.sessionID)) {
                    // If still a player in a room, set presence to false, but do not join new room and throw error instead
                    sessionCurrentRoom._setPlayerPresence(event.sessionID, false);
                    throw new RoomError(`Session ${event.sessionID} is already a player in room ${sessionCurrentRoom.id}`);
                } else {
                    // If a spectator in a room, leave room and join new room as spectator
                    this.sessions.set(event.sessionID, joinRoomID);
                    await sessionCurrentRoom._removeSpectator(event.sessionID);
                    await joinRoom._addSpectator(event.sessionID);
                }
            }

        } else { // Leaving a room client-side

        }

    }


}