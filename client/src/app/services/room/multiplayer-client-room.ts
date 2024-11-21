import { ClientRoom } from "./client-room";
import { RoomModal } from "src/app/components/layout/room/room/room.component";
import { BehaviorSubject, Observable } from "rxjs";
import { EmulatorService } from "../emulator/emulator.service";
import { PlatformInterfaceService } from "../platform-interface.service";
import { MultiplayerRoomState, PlayerIndex } from "src/app/shared/room/multiplayer-room-models";
import { MeService } from "../state/me.service";


export class MultiplayerClientRoom extends ClientRoom {

    private readonly me = this.injector.get(MeService);
    private readonly emulator = this.injector.get(EmulatorService);
    private readonly platformInterface = this.injector.get(PlatformInterfaceService);

    // The index of the client in the room, or null if the client is a spectator
    private myIndex!: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2 | null;

    public override async init(state: MultiplayerRoomState): Promise<void> {

        // Derive the index of the client in the room, or null if the client is a spectator
        const myID = await this.me.getUserID();
        if (state.players[PlayerIndex.PLAYER_1].userid === myID) this.myIndex = PlayerIndex.PLAYER_1;
        else if (state.players[PlayerIndex.PLAYER_2].userid === myID) this.myIndex = PlayerIndex.PLAYER_2;
        else this.myIndex = null;
    }

    /**
     * Get the index of the client in the room, or null if the client is a spectator
     */
    public getMyIndex(): PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2 | null {
        return this.myIndex;
    }

    protected override async onStateUpdate(oldState: MultiplayerRoomState, newState: MultiplayerRoomState): Promise<void> {
        
    }

}