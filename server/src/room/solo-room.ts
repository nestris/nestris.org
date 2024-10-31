import { RoomType, SoloRoomState } from "../../shared/room/room-models";
import { Room } from "../online-users/event-consumers/room-consumer";

export class SoloRoom extends Room<SoloRoomState> {

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(playerSessionID: string) {
        super(
            [playerSessionID],
            { type: RoomType.SOLO, },
        )
    }
    
}