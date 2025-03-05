import { EventConsumer } from "../event-consumer";
import { OnSessionBinaryMessageEvent, OnSessionDisconnectEvent, OnSessionJsonMessageEvent } from "../online-user-events";
import { PacketDisassembler } from "../../../shared/network/stream-packets/packet-disassembler";
import { ChatMessage, ClientRoomEventMessage, InRoomStatus, InRoomStatusMessage, JsonMessage, JsonMessageType, RoomStateUpdateMessage, SendPushNotificationMessage, SpectatorCountMessage } from "../../../shared/network/json-message";
import { OnlineUserManager } from "../online-user-manager";
import { ClientRoomEvent, RoomInfo, RoomState } from "../../../shared/room/room-models";
import { v4 as uuid } from 'uuid';
import { NotificationType } from "../../../shared/models/notifications";
import { UserSessionID } from "../online-user";
import { OnlineUserActivityType } from "../../../shared/models/online-activity";

export class RoomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RoomError";
    }
}

export class RoomAbortError extends RoomError {
    constructor(public readonly userid: string, message: string) {
        super(message);
        this.name = "RoomAbortError";
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
 * 
 */

export class RoomPlayer {
    
    constructor(
        public readonly userid: string,
        public readonly sessionID: string,
        public readonly username: string,
        public leftRoom: boolean = false,
    ) {}

}

export class RoomSpectator {
    constructor(
        public readonly sessionID: string,
    ) {}
}

export abstract class Room<T extends RoomState = RoomState> {

    // Static reference to RoomConsumer and OnlineUserManager that need to be set before any Room objects are created
    protected static Consumer: RoomConsumer;
    protected static Users: OnlineUserManager;
    public static bootstrap(Consumer: RoomConsumer, Users: OnlineUserManager) {
        Room.Consumer = Consumer;
        Room.Users = Users;
    }

    // General information about the room, including the room id and the players in the room
    private roomInfo: RoomInfo;

    // The state of the room, specific to the room type. It is initialized to some initial value that the client receives,
    // but ROOM_STATE_UDPATE events can be sent to sync the updated state of the room with the client.
    private roomState!: T; // initialized on initRoomState()
    
    // List of players in the room, and whether they are present in the room, with the players initialized in constructor
    protected readonly players: RoomPlayer[];

    // List of spectators in the room, with no spectators at the start
    protected readonly spectators: RoomSpectator[] = [];


    constructor(
        activity: OnlineUserActivityType, // The type of activity the user is currently doing
        userSessionIDs: UserSessionID[], // A list of session ids of players in the room
    ) {

        // Assert all sessions are online. Otherwise, throw an abort error.
        userSessionIDs.forEach(userSessionID => {
            if (!Room.Users.isSessionOnline(userSessionID.sessionID)) {
                throw new RoomAbortError(userSessionID.userid, `Session ${userSessionID.sessionID} is not online`);
            }
        });

        // Initialize players as RoomPlayer objects that are not present in the room. On ROOM_PRESENCE messages, they will
        // be marked as present in the room.
        this.players = userSessionIDs.map(userSessionID => {
            const username = Room.Users.getUserInfo(userSessionID.userid)?.username;
            if (!username) throw new RoomAbortError(userSessionID.userid, `User ${userSessionID.userid} failed to get username`);
            return new RoomPlayer(userSessionID.userid, userSessionID.sessionID, username);
        });

        // Check if any of the player session ids are already in a room. If so, throw an error.
        this.players.forEach(player => {
            if (Room.Consumer.getRoomBySessionID(player.sessionID)) {
                throw new RoomAbortError(player.userid, `Session ${player.sessionID} is already in a room`);
            }
        });

        // Check if each of users is already in an activity. If so, throw an error.
        this.players.forEach(player => {

            if (Room.Users.isUserInActivity(player.userid)) {
                Room.Users.sendToUserSession(player.sessionID, new SendPushNotificationMessage(
                    NotificationType.ERROR,
                    "You are already in an activity!"
                ));

                throw new RoomAbortError(player.userid, `User ${player.userid} is already in an activity: ${Room.Users.getUserActivity(player.userid)}`);
            }
        });

        // Set the activity of each user to the room
        this.players.forEach(player => {
            Room.Users.setUserActivity(player.sessionID, activity);
        });


        // Initialize the room info
        this.roomInfo = {
            id: uuid(),
            players: this.players.map(player => {

                const userid = Room.Users.getUserIDBySessionID(player.sessionID)!;
                const username = Room.Users.getUserInfo(userid)!.username;

                return {
                    userid: userid,
                    sessionID: player.sessionID,
                    username: username,
                }
            }),
        };

    }

    // MUST IMPLEMENT

    protected abstract initRoomState(): Promise<T>

    // ======================== PUBLIC GETTERS ========================

    /**
     * Get the room id
     */
    public get id(): string {
        return this.roomInfo.id;
    }

    /**
     * Get all session ids for players in the room
     */
    public get playerSessionIDs(): string[] {
        return this.players.map(player => player.sessionID);
    }

    /**
     * Get all session ids for players in the room that have not left the room
     */
    public get playerSessionIDsInRoom(): string[] {
        return this.players.filter(player => !player.leftRoom).map(player => player.sessionID);
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
     * Get all session ids for all in-room players and spectators in the room
     */
    public get allSessionIDsInRoom(): string[] {
        return this.playerSessionIDsInRoom.concat(this.spectatorSessionIDs);
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
     * Get the room info
     * @returns The room info of the room
     */
    public getRoomInfo(): RoomInfo {
        return this.roomInfo;
    }

    /**
     * Get the room state
     * @returns The room state of the room
     */
    public getRoomState(): T {
        return this.roomState;
    }

    public getPlayerByUserID(userid: string): RoomPlayer | undefined {
        return this.players.find(player => player.userid === userid);
    }

    // ======================== PUBLIC METHODS ========================


    /**
     * Send a message to all players and spectators in the room.
     * @param message The JSON message to send
     */
    public sendToAll(message: JsonMessage | Uint8Array) {
        this.allSessionIDsInRoom.forEach(sessionID => {
            Room.Users.sendToUserSession(sessionID, message);
        });
    }

    /**
     * Send a message to all players in the room except the player with the given session id.
     * @param sessionID The session id of the player to exclude
     * @param message The JSON message to send
     */
    public sendToAllExcept(sessionID: string, message: JsonMessage | Uint8Array) {
        this.allSessionIDsInRoom.forEach(id => {
            if (id !== sessionID) {
                Room.Users.sendToUserSession(id, message);
            }
        });
    }

    /**
     * Update the room state and send a ROOM_STATE_UPDATE message to all players and spectators in the room.
     * @param state The new room state
     */
    public updateRoomState(state: T) {
        this.roomState = state;
        console.log("Updating room state", state);
        this.sendToAll(new RoomStateUpdateMessage(state));
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
     * Precondition: The session id is guaranteed to be a player in the room.
     * @param sessionID The session id of the player that sent the message, guaranteed to be a player in the room.
     * @param message The binary message that was sent.
     */
    protected async onPlayerSendBinaryMessage(sessionID: string, message: PacketDisassembler): Promise<void> {}

    /**
     * Overwrite this method to handle when a client room event is received.
     * Precondition: The session id is guaranteed to be a player in the room.
     * @param sessionID The session id of the player that sent the event
     * @param event The client room event that was received.
     */
    protected async onClientRoomEvent(sessionID: string, event: ClientRoomEvent): Promise<void> {}

    /**
     * Override this method to handle when a player leaves the room.
     * @param userid The userid of the player that left the room
     * @param sessionID The session id of the player that left the room
     */
    protected async onPlayerLeave(userid: string, sessionID: string): Promise<void> {}



    // ======================== METHODS ONLY CALLED BY RoomConsumer ========================

    /**
     * Initialize the room. This should only be called by the RoomConsumer right after the room is created.
     */
    public async _init() {

        // Set the room state
        this.roomState = await this.initRoomState();

        // Trigger the onCreate hook that may be implemented by subclasses
        await this.onCreate();

        // Log the creation of the room
        const playerUsernames = this.roomInfo.players.map(player => player.username).join(", ");
        console.log(`Created room ${this.id} of type ${this.roomState.type} with players ${playerUsernames}`);

        // Send IN_ROOM_STATUS messages to all players in the room to indicate that they are players in the room,
        // including the room info
        this.sendToAll(new InRoomStatusMessage(InRoomStatus.PLAYER, this.roomInfo, this.roomState));
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
        this.sendToAll(message);
    }

    /**
     * If received a client room event, trigger hook to be implemented by subclasses. This should only be called by the RoomConsumer.
     * @param event The client room event to handle.
     */
    public async _onClientRoomEvent(sessionID: string, event: ClientRoomEvent) {
        await this.onClientRoomEvent(sessionID, event);
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
        Room.Users.sendToUserSession(sessionID, new InRoomStatusMessage(InRoomStatus.SPECTATOR, this.roomInfo, this.roomState));

        // Update the spectator count for all players in the room
        this.sendToAll(new SpectatorCountMessage(this.spectators.length));
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
        Room.Users.sendToUserSession(sessionID, new InRoomStatusMessage(InRoomStatus.NONE, null, null));

        // Update the spectator count for all players in the room
        this.sendToAll(new SpectatorCountMessage(this.spectators.length));
    }

    /**
     * Remove a player from the room. This should only be called by the RoomConsumer, which will remove the player from the room
     * @param userid The userid of the player to remove
     * @param sessionID The session id of the player to remove
     */
    async _onPlayerLeave(userid: string, sessionID: string) {

        // Mark the player as having left the room
        this.players.find(player => player.sessionID === sessionID)!.leftRoom = true;

        // Trigger the onPlayerLeave hook
        await this.onPlayerLeave(userid, sessionID);

        // send IN_ROOM_STATUS not in room for the player
        Room.Users.sendToUserSession(sessionID, new InRoomStatusMessage(InRoomStatus.NONE, null, null));

        // Clear the activity of the user
        Room.Users.resetUserActivity(userid);
    }

    /**
     * Destructor for the room. This must be called ONLY by the RoomConsumer when the room is to be deleted.
     */
    async _deinit() {

        // Call the onDelete hook that may be implemented by subclasses
        await this.onDelete();

        // Send IN_ROOM_STATUS messages to all spectators in the room to indicate that they are not in any room anymore
        this.spectatorSessionIDs.forEach(sessionID => {
            Room.Users.sendToUserSession(sessionID, new InRoomStatusMessage(InRoomStatus.NONE, null, null));
        });

        // Log the deletion of the room
        const playerUsernames = this.roomInfo.players.map(player => player.username).join(", ");
        console.log(`Deleted ${this.roomState.type} room ${this.id} with players ${playerUsernames}`);
    }

}

/**
 * Consumer for handling room events. This class is responsible for creating, deleting, and managing rooms.
 */
export class RoomConsumer extends EventConsumer {

    // Map storing room id to room object
    private rooms: Map<string, Room> = new Map();

    // Map storing session id to room id
    private sessions: Map<string, string> = new Map();

    // Initialize OnlineUserManager for Room
    public override async init() {
        Room.bootstrap(this, this.users);
    }

    /**
     * Create a room and update the room and session maps.
     * @param newRoom The newly-constructed room to add
     */
    public async createRoom(newRoom: Room) {

        // Initialize the room
        await newRoom._init();

        // Update room map
        this.rooms.set(newRoom.id, newRoom);

        // Update session map
        newRoom.playerSessionIDs.forEach(sessionID => {
            this.sessions.set(sessionID, newRoom.id);
        });
    }

    /**
     * Given a session id, get the room the user is in.
     * @param sessionID The session id to check
     * @returns The room the user is in, or undefined if the user is not in any room.
     */
    public getRoomBySessionID(sessionID: string): Room | undefined {
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

        // Only care about messages from users in a room
        const room = this.getRoomBySessionID(event.sessionID);
        if (!room) return;

        // Forward chat messages to the room
        if (event.message.type === JsonMessageType.CHAT) 
            room._onChatMessage(event.message as ChatMessage);

        // Forward client room events to the room
        else if (event.message.type === JsonMessageType.CLIENT_ROOM_EVENT)
            await room._onClientRoomEvent(event.sessionID, (event.message as ClientRoomEventMessage).event);

        
    }

    /**
     * Called when a session disconnects entirely. If the session is in a room, remove the session from the room.
     * @param event The session disconnect event
     */
    protected override async onSessionDisconnect(event: OnSessionDisconnectEvent): Promise<void> {
        await this.freeSession(event.userid, event.sessionID);
    }

    /**
     * Free the session from any room. This involves removing the session from the room and the session map. If the session
     * is a player in the room, delete the room entirely after triggering the room's destructor.
     * @param sessionID The session id of the user that disconnected
     * @returns True if the session was successfully freed, false if the session was not in any room.
     */
    public async freeSession(userid: string, sessionID: string): Promise<boolean> {

        // Get the room the session is in. Ignore if the session is not in any room.
        const room = this.getRoomBySessionID(sessionID);
        if (!room) return false;

        // Remove the session from the room
        if (room.isPlayer(sessionID)) {

            // Trigger the onPlayerLeave hook
            await room._onPlayerLeave(userid, sessionID);
            const player = room.getPlayerByUserID(userid);
            console.log(`Player ${player?.username} left room ${room.id}`);

            // If that was the last player in the room, delete the room entirely
            if (room.playerSessionIDsInRoom.length === 0) {
                await room._deinit();
                this.rooms.delete(room.id);
            }
        } else {
            // Remove the spectator from the room
            room._removeSpectator(sessionID);
        }

        // Remove the session from the session map
        this.sessions.delete(sessionID);
        return true;
    }

    /**
     * Get the number of rooms that satisfy the given filter.
     * @param filter The filter to apply to the rooms
     * @returns The number of rooms that satisfy the filter
     */
    public getRoomCount(filter: (room: Room) => boolean = (_) => true): number {
        return Array.from(this.rooms.values()).filter(filter).length;
    }

    public getAllRoomInfo(): RoomInfo[] {
        return Array.from(this.rooms.values()).map(room => room.getRoomInfo());
    }

}