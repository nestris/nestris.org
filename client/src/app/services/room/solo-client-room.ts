import { SoloGameInfo, SoloRoomState } from "src/app/shared/room/solo-room-models";
import { ClientRoom } from "./client-room";
import { RoomModal } from "src/app/components/layout/room/room/room.component";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { EmulatorService } from "../emulator/emulator.service";
import { PlatformInterfaceService } from "../platform-interface.service";
import { QuestService } from "../quest.service";
import { getQuest, QuestCategory } from "src/app/shared/nestris-org/quest-system";
import { OcrGameService } from "../ocr/ocr-game.service";
import { Platform } from "src/app/shared/models/platform";
import { OCRStateID } from "src/app/ocr/state-machine/ocr-states/ocr-state-id";

export enum SoloClientState {
    BEFORE_GAME_MODAL = 'BEFORE_GAME_MODAL',
    IN_GAME = 'IN_GAME',
    TOPOUT = 'TOPOUT',
    AFTER_GAME_MODAL = 'AFTER_GAME_MODAL',
}

export class SoloClientRoom extends ClientRoom {

    readonly emulator = this.injector.get(EmulatorService);
    readonly ocr = this.injector.get(OcrGameService);
    readonly platformInterface = this.injector.get(PlatformInterfaceService);
    readonly activeQuestService = this.injector.get(QuestService);

    // The level at which the game starts, persisted across games
    public static startLevel$: BehaviorSubject<number> = new BehaviorSubject(18);

    private soloState$ = new BehaviorSubject<SoloClientState>(SoloClientState.BEFORE_GAME_MODAL);

    private originalGames!: SoloGameInfo[];

    private ocrSubscription?: Subscription;
    public detectingOCR$ = new BehaviorSubject<boolean>(false);
    private inGame: boolean = false;

    public override async init(state: SoloRoomState): Promise<void> {

        // Get the original games already completed in the room
        this.originalGames = state.previousGames;

        // Set level to 29 if doing a level 29 quest
        const activeQuestID = this.activeQuestService.activeQuestID$.getValue();
        if (activeQuestID && getQuest(activeQuestID).category === QuestCategory.LINES29) SoloClientRoom.startLevel$.next(29);

        // Initialize at before game
        this.setSoloState(SoloClientState.BEFORE_GAME_MODAL);

        // If going into solo mode game and in ocr, start capturing
        if (this.platformInterface.getPlatform() === Platform.OCR) {

            this.detectingOCR$.next(true);

            const currentState$ = this.ocr.startGameCapture({
                startLevel: null, // Player can play on any level in solo mode with OCR
                seed: null, // No required seed
                multipleGames: true, // Player can play as many games as desired while on solo page
            });

            this.ocrSubscription = currentState$?.subscribe(state => {
                if (state.id === OCRStateID.PIECE_DROPPING && !this.inGame) {
                    this.setSoloState(SoloClientState.IN_GAME);
                    this.detectingOCR$.next(false);
                    this.inGame = true;
                } if (state.id === OCRStateID.GAME_END) this.inGame = false;
            });
        }
    }

    protected override async onStateUpdate(oldState: SoloRoomState, newState: SoloRoomState): Promise<void> {
        
        // if topout, go to TOPOUT mode
        // if (oldState.serverInGame && !newState.serverInGame) {
        //     this.setSoloState(SoloClientState.TOPOUT);
        // }

        if (
            this.platformInterface.getPlatform() === Platform.OCR &&
            !this.inGame &&
            oldState.lastGameSummary === null
            && newState.lastGameSummary
        ) {
            this.setSoloState(SoloClientState.AFTER_GAME_MODAL);
            this.detectingOCR$.next(true);
        }

    }

    public setSoloState(state: SoloClientState) {

        // IF OCR platform, skip before-game modal and go straight to game
        if (state === SoloClientState.BEFORE_GAME_MODAL && this.platformInterface.getPlatform() === Platform.OCR) {
            state = SoloClientState.IN_GAME;
            
        }

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


    public startGame(countdown = 3) {

        if (this.platformInterface.getPlatform() === Platform.OCR) throw new Error(`Cannot start emulator game on OCR`);

        const startLevel = SoloClientRoom.startLevel$.getValue();
        console.log('Starting game with start level', startLevel);

        // Transition to in-game state
        this.setSoloState(SoloClientState.IN_GAME);

        // Start the game
        this.emulator.startGame(startLevel, true, undefined, this, countdown);
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

    public override destroy(): void {
        this.emulator.stopGame(true);
        this.ocr.stopGameCapture();
        this.ocrSubscription?.unsubscribe();
    }

}