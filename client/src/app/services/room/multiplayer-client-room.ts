import { ClientRoom } from "./client-room";
import { RoomModal } from "src/app/components/layout/room/room/room.component";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { EmulatorService } from "../emulator/emulator.service";
import { PlatformInterfaceService } from "../platform-interface.service";
import { MultiplayerRoomEventType, MultiplayerRoomState, MultiplayerRoomStatus, PlayerIndex } from "src/app/shared/room/multiplayer-room-models";
import { MeService } from "../state/me.service";
import { ServerPlayer } from "./server-player";
import { WebsocketService } from "../websocket.service";
import { PacketGroup } from "src/app/shared/network/stream-packets/packet";
import { GameStateSnapshot, GameStateSnapshotWithoutBoard } from "src/app/shared/game-state-from-packets/game-state";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import { AlertService } from "../alert.service";
import { TrophyAlertComponent } from "src/app/components/alerts/trophy-alert/trophy-alert.component";


export class MultiplayerClientRoom extends ClientRoom {

    private readonly me = this.injector.get(MeService);
    private readonly websocket = this.injector.get(WebsocketService);
    private readonly emulator = this.injector.get(EmulatorService);
    private readonly platform = this.injector.get(PlatformInterfaceService);
    private readonly alerts = this.injector.get(AlertService);

    private serverPlayers!: {[PlayerIndex.PLAYER_1]: ServerPlayer, [PlayerIndex.PLAYER_2]: ServerPlayer};

    // The index of the client in the room, or null if the client is a spectator
    private myIndex!: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2 | null;

    private packetGroupSubscription?: Subscription;

    public override async init(state: MultiplayerRoomState): Promise<void> {

        // Reset game data
        this.platform.updateGameData({
            board: new TetrisBoard(),
            level: state.startLevel,
            lines: 0,
            score: 0,
            nextPiece: TetrominoType.ERROR_TYPE,
            trt: 0,
            drought: null,
            countdown: undefined
        })

        // Derive the index of the client in the room, or null if the client is a spectator
        const myID = await this.me.getUserID();
        if (state.players[PlayerIndex.PLAYER_1].userid === myID) this.myIndex = PlayerIndex.PLAYER_1;
        else if (state.players[PlayerIndex.PLAYER_2].userid === myID) this.myIndex = PlayerIndex.PLAYER_2;
        else this.myIndex = null;

        // Initialize serverPlayers
        const defaultLevel = state.startLevel;
        this.serverPlayers = {
            [PlayerIndex.PLAYER_1]: new ServerPlayer(defaultLevel),
            [PlayerIndex.PLAYER_2]: new ServerPlayer(defaultLevel),
        }

        // Subscribe to websocket binary messages
        this.websocket.setPacketGroupContainsPrefix(true);
        this.packetGroupSubscription = this.websocket.onPacketGroup().subscribe(async (packetGroup: PacketGroup) => {
            
            if (packetGroup.playerIndex === undefined) throw new Error("Player index not defined in packet group");

            // Only process packets that are intended for player 1 or player 2
            const playerIndex = packetGroup.playerIndex as PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2;
            if (![PlayerIndex.PLAYER_1, PlayerIndex.PLAYER_2].includes(playerIndex)) return;

            // Process the packets
            packetGroup.packets.forEach(packet => this.serverPlayers[playerIndex].onReceivePacket(packet));
        });
    }

    /**
     * Get the index of the client in the room, or null if the client is a spectator
     */
    public getMyIndex(): PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2 | null {
        return this.myIndex;
    }

    public getSnapshotForPlayer$(playerIndex: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): Observable<GameStateSnapshotWithoutBoard> {
        return this.serverPlayers[playerIndex].getSnapshot$();
    }

    public getBoardForPlayer$(playerIndex: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): Observable<TetrisBoard> {
        return this.serverPlayers[playerIndex].getBoard$();
    }

    protected override async onStateUpdate(oldState: MultiplayerRoomState, newState: MultiplayerRoomState): Promise<void> {

        // If client goes from not ready to ready, reset game
        for (const pi of [PlayerIndex.PLAYER_1, PlayerIndex.PLAYER_2]) {
            const playerIndex = pi as PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2;
            if (!oldState.ready[playerIndex] && newState.ready[playerIndex]) {
                this.serverPlayers[playerIndex].resetSnapshot();

                // Reset game data if client is the player
                if (this.getMyIndex() === playerIndex) {
                    this.platform.updateGameData({
                        board: new TetrisBoard(),
                        level: newState.startLevel,
                        lines: 0,
                        score: 0,
                        nextPiece: TetrominoType.ERROR_TYPE,
                        trt: 0,
                        drought: null,
                        countdown: undefined
                    })
                }
            }
        }

        // If client is a player, and going from BEFORE_GAME -> IN_GAME, start game
        if (this.myIndex !== null && oldState.status === MultiplayerRoomStatus.BEFORE_GAME && newState.status === MultiplayerRoomStatus.IN_GAME) {
            this.emulator.startGame(newState.startLevel, true, newState.currentSeed);
        }

        // if going to AFTER_MATCH and resigned, show after match modal
        if (oldState.status !== MultiplayerRoomStatus.AFTER_MATCH && newState.status === MultiplayerRoomStatus.AFTER_MATCH) {
            if (newState.wonByResignation) this.showAfterMatchModal();
        }

    }

    /**
     * Sent when the client is ready to start the game
     */
    public sendReadyEvent() {
        this.sendClientRoomEvent({type: MultiplayerRoomEventType.READY });
    }

    /**
     * Sent to show the after match modal
     */
    public showAfterMatchModal() {
        this.modal$.next(RoomModal.MULTIPLAYER_AFTER_MATCH);
    }

    public override destroy(): void {
        this.emulator.stopGame(true);
        this.packetGroupSubscription?.unsubscribe();
    }

}