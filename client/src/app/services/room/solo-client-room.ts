import { SoloRoomState } from "src/app/shared/room/solo-room-models";
import { ClientRoom } from "./client-room";
import { RoomModal } from "src/app/components/layout/room/room/room.component";
import { BehaviorSubject } from "rxjs";
import { EmulatorService } from "../emulator/emulator.service";
import { PlatformInterfaceService } from "../platform-interface.service";


export class SoloClientRoom extends ClientRoom<SoloRoomState> {

    readonly emulator = this.injector.get(EmulatorService);
    readonly platformInterface = this.injector.get(PlatformInterfaceService);

    // The level at which the game starts, persisted across games
    public static startLevel$: BehaviorSubject<number> = new BehaviorSubject(18);

    public override async init(): Promise<void> {

        // When entering play page, show the before game modal
        this.modal$.next(RoomModal.SOLO_BEFORE_GAME);

    }

    protected override async onStateUpdate(oldState: SoloRoomState, newState: SoloRoomState): Promise<void> {
        console.log('SoloClientRoom.onStateUpdate', oldState, newState);
    }

    public startGame() {
        const startLevel = SoloClientRoom.startLevel$.getValue();
        console.log('Starting game with start level', startLevel);

        // Hide the modal
        this.modal$.next(null);

        // Start the game
        this.emulator.startGame(startLevel, true);
    }

}