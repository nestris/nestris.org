import { BehaviorSubject, filter, Observable, Subject } from "rxjs";
import { ChatMessage, ClientRoomEventMessage, InRoomStatus, InRoomStatusMessage, JsonMessage, JsonMessageType, RoomStateUpdateMessage } from "../../shared/network/json-message";
import { RankedQueueConsumer } from "../online-users/event-consumers/ranked-queue-consumer";
import { BotUser } from "./bot-user";
import { sleepWithTimeout, waitUntilCondition, waitUntilValue } from "../scripts/rxjs";
import { sleep } from "../../shared/scripts/sleep";
import { randomChoice, randomInt } from "../../shared/scripts/math";
import { MultiplayerRoomEventType, MultiplayerRoomState, MultiplayerRoomStatus, PlayerIndex } from "../../shared/room/multiplayer-room-models";
import { EmulatorGameState } from "../../shared/emulator/emulator-game-state";
import { GymRNG } from "../../shared/tetris/piece-sequence-generation/gym-rng";
import { CurrentlyPressedKeys, KeyManager } from "../../shared/emulator/currently-pressed-keys";
import { TimeDelta } from "../../shared/scripts/time-delta";
import { GameAbbrBoardPacket, GameCountdownPacket, GameEndPacket, GameFullBoardPacket, GamePlacementPacket, GameStartPacket } from "../../shared/network/stream-packets/packet";
import { PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { BinaryEncoder } from "../../shared/network/binary-codec";
import { RoomConsumer } from "../online-users/event-consumers/room-consumer";

const BEFORE_GAME_MESSAGE = [
    "glhf",
    "gl",
    "good luck",
    "glhf!",
    "gl!",
    "best of luck",
];

class LeftRoomEarlyError extends Error {
    constructor() { super('Left room early'); }
}

class MatchAbortedError extends Error {
    constructor() { super('Match aborted'); }
}

export class RankedBotUser extends BotUser {
    readonly queueConsumer = this.eventManager.getConsumer(RankedQueueConsumer);
    readonly roomConsumer = this.eventManager.getConsumer(RoomConsumer);

    private inRoomStatus$ = new BehaviorSubject<InRoomStatus>(InRoomStatus.NONE);
    private roomState$ = new BehaviorSubject<MultiplayerRoomState | null>(null);

    override async start() {

        // Connect the bot to the server
        this.connect();

        // Keep queuing and playing matches indefinitely
        while (true) {


            await sleep(randomInt(1000, 3000));

            // Find a match in the ranked queue
            await this.handleFindMatch();
            try {

                // If the bot is kicked from the room, end this function early
                const leftRoom$ = this.inRoomStatus$.pipe(
                    filter(status => status === InRoomStatus.NONE)
                );
                // This error is thrown when the bot leaves the room early
                const error = new LeftRoomEarlyError();

                await this.handleMatchStart(leftRoom$, error);
                await this.handlePlayingGame();
                await this.handleMatchEnd(leftRoom$, error);

            } catch (error) {
                if (error instanceof LeftRoomEarlyError) {
                    console.log(`Bot ${this.username} left the room early`);
                } else if (error instanceof MatchAbortedError) {
                    // If match aborted, leave room
                    console.log(`Match bot ${this.username} was in was aborted, leaving room`);
                    await this.roomConsumer.freeSession(this.userid, this.sessionID);
                } else {
                    console.error(`Error in bot ${this.username}:`, error);
                }
            }
        }
    }

    /**
     * Join the ranked queue and waits for a match to be found and the bot to be placed in a room.
     * After this function completes, the bot is in a room and ready to play.
     */
    private async handleFindMatch() {

        // Join the ranked queue
        this.queueConsumer.joinRankedQueue(this.sessionID);
        console.log(`Bot ${this.username} joined the ranked queue, waiting for room...`);

        // Wait until the bot is in the ranked room
        await waitUntilValue(this.inRoomStatus$, InRoomStatus.PLAYER);
        console.log(`Bot ${this.username} is now in a room!`);
    }

    /**
     * Called when bot has joined the ranked room. Handles sending an initial message, sending 
     * the 'READY' signal, and waiting for the game to start.
     * After this function completes, the bot should start playing the game.
     * 
     * @param leftRoom$ The observable that emits when the bot prematurely leaves the room
     * @param error The error to throw if the bot leaves the room early
     * @throws {LeftRoomEarlyError} If the bot leaves the room early, thus ending this function early.
     */
    private async handleMatchStart(leftRoom$: Observable<unknown>, error: Error) {

        // Wait a random amount of time before sending a message
        await sleepWithTimeout(randomInt(1000, 2000), leftRoom$, error);

        // Randomly send a message before the game starts
        const message = randomChoice(BEFORE_GAME_MESSAGE);
        if (Math.random() < 0.5) this.sendJsonMessageToServer(new ChatMessage(this.username, message));

        // Wait a random amount of time before sending the 'READY' signal
        await sleepWithTimeout(randomInt(1000, 2000), leftRoom$, error);

        // Send 'READY' signal to the server
        this.sendJsonMessageToServer(new ClientRoomEventMessage({type: MultiplayerRoomEventType.READY }));

        // wait for the game to start (both players are ready)
        await waitUntilCondition(this.roomState$, state => state?.status !== MultiplayerRoomStatus.BEFORE_GAME, leftRoom$, error);
        if (this.roomState$.getValue()?.status === MultiplayerRoomStatus.ABORTED) throw new MatchAbortedError();
        console.log(`Bot ${this.username} is now in game!`);        
    }

    /**
     * Play the game and stream data to the server until the game is over.
     */
    private async handlePlayingGame() {

        const roomState = this.roomState$.getValue();
        if (!roomState) throw new Error('Bot is not in a room');

        // Initialize the game state with the room's seed and start level
        const rng = new GymRNG(roomState.currentSeed);
        const state = new EmulatorGameState(roomState.startLevel, rng, 3, false);

        // Manages calculating time differences between frames
        const timeDelta = new TimeDelta();

        // Batch packets together and send them at a regular interval
        const packetBatcher = new PacketBatcher((binaryData) => this.sendBinaryMessageToServer(binaryData));

        // Send initial game start packet
        packetBatcher.sendPacket(new GameStartPacket().toBinaryEncoder({
            level: roomState.startLevel,
            current: state.getCurrentPieceType(),
            next: state.getNextPieceType(),
        }));

        // Send initial frame packet
        packetBatcher.sendPacket(new GameAbbrBoardPacket().toBinaryEncoder({
            delta: timeDelta.getDelta(),
            mtPose: state.getActivePiece().getMTPose(),
        }));

        const EMULATOR_FPS = 60;
        let framesDone: number = 0;
        let epoch: number = performance.now();

        // Loop until topout
        while (true) {
        
            // calculate how many frames to advance based on time elapsed to maintain 60fps
            const diff = performance.now() - epoch;
            const frames = diff / 1000 * EMULATOR_FPS | 0;
            const frameAmount = frames - framesDone;
        
            // Advance as many frames as needed to catch up to current time
            let gameOver = false;
            for (let i = 0; i < frameAmount; i++) {
                gameOver = this.advanceEmulatorState(state, timeDelta, packetBatcher);
                if (gameOver) break;
            }
            if (gameOver) break;
        
            // If more than one frame was executed in a tick cycle, log the number of frames skipped
            if (frameAmount > 1) console.log("Skipped", frameAmount-1, "frames");
        
            // update the number of frames done for the next calculation of frames to advance
            framesDone = frames;

            // Yield control to the event loop briefly
            await sleep(10);
        }

        // Send game end packet
        packetBatcher.sendPacket(new GameEndPacket().toBinaryEncoder({}));

        // Send any remaining packets and end the packet batcher interval
        packetBatcher.end();

        console.log(`Bot ${this.username} finished the game!`);
    }

    /**
     * Advance the emulator state by one game frame and send the updated state to the server.
     * @param state The current emulator game state to modify in-place
     * @param timeDelta The time delta object to use for calculating time differences
     * @param packetBatcher The packet batcher to use for sending packets
     * @returns True if the game is over, false otherwise
     */
    private advanceEmulatorState(state: EmulatorGameState, timeDelta: TimeDelta, packetBatcher: PacketBatcher): boolean {

        // Store previous state to compare with new state
        const previousBoard = state.getDisplayBoard();
        const previousCountdown = state.getCountdown();
        const wasPieceLocked = state.isPieceLocked();

        // Advance the emulator state by one frame
        const pressedKeys = KeyManager.ALL_KEYS_UNPRESSED;
        state.executeFrame(pressedKeys);

        // Get the new state
        const currentBoard = state.getDisplayBoard();
        const currentCountdown = state.getCountdown();
        const isPieceLocked = state.isPieceLocked();
        const activePiece = state.getActivePiece();
        

        // send countdown packet if countdown has changed
        if (currentCountdown !== previousCountdown) {
            packetBatcher.sendPacket(new GameCountdownPacket().toBinaryEncoder({
                delta: timeDelta.getDelta(),
                countdown: currentCountdown ?? 0,
            }));
        }

        // Send placement packet if piece has been placed
        if (!wasPieceLocked && isPieceLocked) {
            packetBatcher.sendPacket(new GamePlacementPacket().toBinaryEncoder({
                nextNextType: state.getNextNextPieceType(),
                    mtPose: activePiece.getMTPose(),
                    pushdown: state.getPushdownPoints(),
            }));
        }

        // Send packet with board info if board has changed
        if (!previousBoard.equals(currentBoard)) {

            if (!isPieceLocked) {
                // if there's an active piece, send abbreviated packet to save bandwidth
                packetBatcher.sendPacket(new GameAbbrBoardPacket().toBinaryEncoder({
                    delta: timeDelta.getDelta(),
                    mtPose: activePiece.getMTPose(),
                }));

            } else {
                // send full state, since there is no active piece to send abbreviated packet info
                packetBatcher.sendPacket(new GameFullBoardPacket().toBinaryEncoder({
                    delta: timeDelta.getDelta(),
                    board: currentBoard,
                }));
            }

        }

        const topout = state.isToppedOut();
        if (topout) console.log(`Bot ${this.username} topped out`);
        return topout;
    }

    /**
     * Wait until the server determines that the match is over, then leave the room.
     * @param leftRoom$ The observable that emits when the bot prematurely leaves the room
     * @param error The error to throw if the bot leaves the room early
     */
    private async handleMatchEnd(leftRoom$: Observable<unknown>, error: Error) {

        // Wait until the match is over, or the bot leaves the room
        await waitUntilCondition(this.roomState$, state => state?.status === MultiplayerRoomStatus.AFTER_MATCH, leftRoom$, error);

        // Leave the room
        await this.roomConsumer.freeSession(this.userid, this.sessionID);
    }

    public override async onJsonMessageFromServer(message: JsonMessage) {

        // Update the bot's room status
        if (message.type === JsonMessageType.IN_ROOM_STATUS) {
            const roomStatus = message as InRoomStatusMessage;
            if (roomStatus.status === InRoomStatus.NONE) this.roomState$.next(null);
            this.inRoomStatus$.next(roomStatus.status);
        } else if (message.type === JsonMessageType.ROOM_STATE_UPDATE) {
            const roomState = message as RoomStateUpdateMessage;
            // This bot only plays in multiplayer rooms, so we can safely cast
            this.roomState$.next(roomState.state as MultiplayerRoomState);
        }

    }
}

/**
 * A class that batches packets together and sends them at a regular interval.
 */
class PacketBatcher {

    private assembler: PacketAssembler = new PacketAssembler();
    private interval: any;

    /**
     * Create a new packet batcher that sends packets at a regular interval.
     * @param sendBatchedPackets The function to call to send the batched packets
     * @param batchTimeMs The interval in milliseconds to send the packets
     */
    constructor(
        private readonly sendBatchedPackets: (packet: Uint8Array) => void,
        batchTimeMs: number = 250, // in ms, the interval to batch and send packets
    ) {
        // every batchTimeMs, send all accumulated data through callback
        this.interval = setInterval(() => this.flush(), batchTimeMs);
    }

    /**
     * Add a packet to the batcher to be sent.
     * @param packet The packet to add to the batch
     */
    public sendPacket(packetContent: BinaryEncoder) {
        this.assembler.addPacketContent(packetContent);
    }

    /**
     * End the packet batcher and send any remaining packets.
     */
    public end() {
        clearInterval(this.interval);
        this.flush();
    }

    /**
     * Batch and send all packets that have been accumulated since the last batch.
     * @returns 
     */
    private flush() {

        // if there are no packets to send, don't do anything
        if (!this.assembler.hasPackets()) {
            return;
        }
    
        // encode the packets into Uint8Array, and send it
        const binaryData = this.assembler.encode();
        this.sendBatchedPackets(binaryData);
    
        // clear the assembler for the next batch of packets
        this.assembler = new PacketAssembler();
    }


}