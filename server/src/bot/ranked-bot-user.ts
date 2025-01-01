import { BehaviorSubject } from "rxjs";
import { ChatMessage, ClientRoomEventMessage, InRoomStatus, InRoomStatusMessage, JsonMessage, JsonMessageType, RoomStateUpdateMessage } from "../../shared/network/json-message";
import { RankedQueueConsumer } from "../online-users/event-consumers/ranked-queue-consumer";
import { BotUser } from "./bot-user";
import { waitUntilCondition, waitUntilValue } from "../scripts/rxjs";
import { sleep } from "../../shared/scripts/sleep";
import { randomChoice, randomInt } from "../../shared/scripts/math";
import { MultiplayerRoomEventType, MultiplayerRoomState, MultiplayerRoomStatus } from "../../shared/room/multiplayer-room-models";

const BEFORE_GAME_MESSAGE = [
    "glhf",
    "gl",
    "good luck",
    "glhf!",
    "gl!",
    "best of luck",
];

export class RankedBotUser extends BotUser {
    readonly queue = this.eventManager.getConsumer(RankedQueueConsumer);

    private inRoomStatus$ = new BehaviorSubject<InRoomStatus>(InRoomStatus.NONE);
    private roomState$ = new BehaviorSubject<MultiplayerRoomState | null>(null);

    override async start() {

        // Connect the bot to the server
        this.connect();

        // Join the ranked queue as soon as the bot is online
        this.queue.joinRankedQueue(this.sessionID);
        console.log(`Bot ${this.username} joined the ranked queue, waiting for room...`);

        // Wait until the bot is in the ranked room
        await waitUntilValue(this.inRoomStatus$, InRoomStatus.PLAYER);
        console.log(`Bot ${this.username} is now in a room!`);

        await sleep(randomInt(1000, 2000));

        // Randomly send a message before the game starts
        const message = randomChoice(BEFORE_GAME_MESSAGE);
        if (Math.random() < 0.5) this.sendJsonMessageToServer(new ChatMessage(this.username, message));

        await sleep(randomInt(1000, 2000));

        // Send 'READY' signal to the server
        this.sendJsonMessageToServer(new ClientRoomEventMessage({type: MultiplayerRoomEventType.READY }));

        // wait for the game to start (both players are ready)
        await waitUntilCondition(this.roomState$, state => state?.status === MultiplayerRoomStatus.IN_GAME);
        console.log(`Bot ${this.username} is now in game!`);

        // Start playing the game

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