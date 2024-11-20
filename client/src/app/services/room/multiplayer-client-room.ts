import { ClientRoom } from "./client-room";
import { RoomModal } from "src/app/components/layout/room/room/room.component";
import { BehaviorSubject, Observable } from "rxjs";
import { EmulatorService } from "../emulator/emulator.service";
import { PlatformInterfaceService } from "../platform-interface.service";
import { MultiplayerRoomState } from "src/app/shared/room/multiplayer-room-models";


export class MultiplayerClientRoom extends ClientRoom {

    readonly emulator = this.injector.get(EmulatorService);
    readonly platformInterface = this.injector.get(PlatformInterfaceService);


    public override async init(): Promise<void> {

    }

    protected override async onStateUpdate(oldState: MultiplayerRoomState, newState: MultiplayerRoomState): Promise<void> {
        

    }



}