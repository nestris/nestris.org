import { SoloGameInfo, SoloRoomState } from "src/app/shared/room/solo-room-models";
import { ClientRoom } from "./client-room";
import { RoomModal } from "src/app/components/layout/room/room/room.component";
import { BehaviorSubject, Observable } from "rxjs";
import { EmulatorService } from "../emulator/emulator.service";
import { PlatformInterfaceService } from "../platform-interface.service";

export enum SoloClientState {
    BEFORE_GAME_MODAL = 'BEFORE_GAME_MODAL',
    IN_GAME = 'IN_GAME',
    TOPOUT = 'TOPOUT',
    AFTER_GAME_MODAL = 'AFTER_GAME_MODAL',
}

export class SoloClientRoom extends ClientRoom {

    readonly emulator = this.injector.get(EmulatorService);
    readonly platformInterface = this.injector.get(PlatformInterfaceService);

    // The level at which the game starts, persisted across games
    public static startLevel$: BehaviorSubject<number> = new BehaviorSubject(18);

    private soloState$ = new BehaviorSubject<SoloClientState>(SoloClientState.BEFORE_GAME_MODAL);

    private originalGames!: SoloGameInfo[];

    public override async init(state: SoloRoomState): Promise<void> {

        // Get the original games already completed in the room
        this.originalGames = state.previousGames;

        // When entering play page, show the before game modal
        this.modal$.next(RoomModal.SOLO_BEFORE_GAME);

    }

    protected override async onStateUpdate(oldState: SoloRoomState, newState: SoloRoomState): Promise<void> {
        
        // if topout, go to TOPOUT mode
        if (oldState.serverInGame && !newState.serverInGame) {
            this.setSoloState(SoloClientState.TOPOUT);
        }

    }

    public setSoloState(state: SoloClientState) {
        this.soloState$.next(state);

        // Set the corresponding modal
        switch (state) {
            case SoloClientState.BEFORE_GAME_MODAL:
                this.modal$.next(RoomModal.SOLO_BEFORE_GAME);
                break;
            case SoloClientState.AFTER_GAME_MODAL:
                this.modal$.next(RoomModal.SOLO_AFTER_GAME);
                break;
            default:
                this.modal$.next(null);
        }
    }

    // Go from after-game modal to before-game modal
    public goToNextGame() {
        this.setSoloState(SoloClientState.BEFORE_GAME_MODAL);
    }


    public startGame() {
        const startLevel = SoloClientRoom.startLevel$.getValue();
        console.log('Starting game with start level', startLevel);

        // Transition to in-game state
        this.setSoloState(SoloClientState.IN_GAME);

        // Start the game
        this.emulator.startGame(startLevel, true);
    }

    public getSoloState$(): Observable<SoloClientState> {
        return this.soloState$.asObservable();
    }

    public getSoloState(): SoloClientState {
        return this.soloState$.getValue();
    }

    public isOriginalGame(gameID: string): boolean {
        return this.originalGames.some(game => game.gameID === gameID);
    }

}