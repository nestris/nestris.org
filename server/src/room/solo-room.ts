import { RoomType } from "../../shared/room/room-models";
import { Room } from "../online-users/event-consumers/room-consumer";
import { v4 as uuid } from 'uuid';

export class SoloRoom extends Room {

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(playerSessionID: string) {
        super(
            // SoloRoomInfo
            {
                type: RoomType.SOLO,
                id: uuid(),
            },

            // playerSessionIDs
            [playerSessionID],
        )
    }
    
}