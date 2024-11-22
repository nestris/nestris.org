import { UserSessionID } from "../online-users/online-user";
import { XPDelta } from "../../shared/room/multiplayer-room-models";
import { MultiplayerRoom } from "./multiplayer-room";

export class RankedMultiplayerRoom extends MultiplayerRoom {

    constructor(
        player1SessionID: UserSessionID,
        player2SessionID: UserSessionID,
        private readonly player1XPDelta: XPDelta, // How much player 1 will gain/lose
        private readonly player2XPDelta: XPDelta, // How much player 2 will gain/lose
    ) {
        super(player1SessionID, player2SessionID)

    }

}