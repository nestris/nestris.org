import { UserSessionID } from "../online-users/online-user";
import { MultiplayerRoomState, PlayerIndex, TrophyDelta, XPDelta } from "../../shared/room/multiplayer-room-models";
import { MultiplayerRoom } from "./multiplayer-room";
import { v4 as uuid } from 'uuid';
import { DBMatchEndEvent, DBUserObject } from "../database/db-objects/db-user";


export class RankedMultiplayerRoom extends MultiplayerRoom {

    // Unique match ID for this ranked multiplayer match
    private readonly matchID: string = uuid();

    constructor(
        player1SessionID: UserSessionID,
        player2SessionID: UserSessionID,
        private readonly player1TrophyDelta: TrophyDelta, // How much player 1 will gain/lose
        private readonly player2TrophyDelta: TrophyDelta, // How much player 2 will gain/lose
    ) {
        super(
            player1SessionID, player2SessionID,
            true, // Ranked
            18, // Start level
        );
    }

    private calculateXPGain(state: MultiplayerRoomState, playerIndex: PlayerIndex): number {
        return 1000;
    }

    /**
     * On end of ranked multiplayer match, update trophies and XP for both players based on the match result.
     * @param state The state of the room
     */
    protected async onMatchEnd(state: MultiplayerRoomState): Promise<void> {

        // Iterate through each player in the game to update trophies and XP
        this.iterateGamePlayers(async (player, playerIndex) => {

            // Calculate trophy change
            const trophyDelta = playerIndex === PlayerIndex.PLAYER_1 ? this.player1TrophyDelta : this.player2TrophyDelta;
            let trophyChange;
            if (state.matchWinner === PlayerIndex.DRAW) trophyChange = Math.round((trophyDelta.trophyGain + trophyDelta.trophyLoss) / 2);
            else if (state.matchWinner === playerIndex) trophyChange = trophyDelta.trophyGain;
            else trophyChange = trophyDelta.trophyLoss;

            // Update each player's trophies and XP after the match, and calculate quest progress
            await DBUserObject.alter(player.userid, new DBMatchEndEvent({
                users: RankedMultiplayerRoom.Users,
                sessionID: player.sessionID,
                xpGained: this.calculateXPGain(state, playerIndex),
                trophyChange: trophyChange,
            }), false);
        });

    }

    /**
     * On creating the ranked multiplayer room, add match to the database
     */
    protected override async onCreate(): Promise<void> {

        const  { userid: player1UserID, trophies: player1Trophies } = this.getRoomState().players[PlayerIndex.PLAYER_1];
        const  { userid: player2UserID, trophies: player2Trophies } = this.getRoomState().players[PlayerIndex.PLAYER_2];

        // TODO: Add match to database
        
    }
}